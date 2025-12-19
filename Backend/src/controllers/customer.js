import express from "express";
import bcrypt from "bcryptjs";
import midtransClient from "midtrans-client";
import { randomUUID } from "node:crypto";
import { isValidObjectId } from "mongoose";
import Booking from "../models/Booking.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Coupon from "../models/Coupon.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import {
  buildBookingPayload,
  buildBookingsResponse,
  buildServicesResponse,
  buildUserPayload,
} from "../utils/serializers.js";

const WORK_START_MINUTE = 8 * 60; // 08:00
const WORK_END_MINUTE = 17 * 60; // 17:00
const WORK_MINUTES_PER_STAFF = WORK_END_MINUTE - WORK_START_MINUTE;
const MINUTE_STEP = 15;
const SLOT_INCREMENT_MINUTES = 30;

const CLOSED_DAY_INDEX = 1; // Monday closed (0 = Sunday)

const parseMonthParam = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const [yearStr, monthStr] = trimmed.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  if (month < 0 || month > 11) {
    return null;
  }

  return new Date(year, month, 1);
};

const toDateKey = (dateLike) => {
  if (!dateLike) {
    return null;
  }
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split("T")[0];
};

const clampToWorkday = (minutes) => {
  if (!Number.isFinite(minutes)) {
    return null;
  }

  if (minutes < WORK_START_MINUTE) {
    return WORK_START_MINUTE;
  }

  if (minutes > WORK_END_MINUTE) {
    return WORK_END_MINUTE;
  }

  return minutes;
};

const minutesFromDate = (dateLike) => {
  if (!dateLike) {
    return null;
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getHours() * 60 + date.getMinutes();
};

const buildTimeline = (bookings) => {
  const totalSteps = Math.ceil(
    (WORK_END_MINUTE - WORK_START_MINUTE) / MINUTE_STEP
  );
  const timeline = Array(totalSteps).fill(0);

  bookings.forEach(({ startMinutes, endMinutes }) => {
    const clampedStart = clampToWorkday(startMinutes);
    const clampedEnd = clampToWorkday(endMinutes);

    if (clampedStart === null || clampedEnd === null) {
      return;
    }

    if (clampedEnd <= clampedStart) {
      return;
    }

    const startIndex = Math.max(
      0,
      Math.floor((clampedStart - WORK_START_MINUTE) / MINUTE_STEP)
    );
    const endIndex = Math.min(
      totalSteps,
      Math.ceil((clampedEnd - WORK_START_MINUTE) / MINUTE_STEP)
    );

    for (let index = startIndex; index < endIndex; index += 1) {
      timeline[index] += 1;
    }
  });

  return timeline;
};

const formatTimeLabel = (startMinutes, endMinutes) => {
  const pad = (value) => value.toString().padStart(2, "0");
  const startHours = Math.floor(startMinutes / 60);
  const startMins = startMinutes % 60;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${pad(startHours)}:${pad(startMins)} - ${pad(endHours)}:${pad(
    endMins
  )}`;
};

const formatTimePoint = (minutes) => {
  const pad = (value) => value.toString().padStart(2, "0");
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${pad(hours)}:${pad(mins)}`;
};

const buildSlotOptions = ({ timeline, slotDuration, staffCount }) => {
  if (!timeline.length || staffCount <= 0) {
    return [];
  }

  const safeSlotDuration = Math.max(slotDuration, MINUTE_STEP);
  const slotSteps = Math.ceil(safeSlotDuration / MINUTE_STEP);
  const incrementSteps = Math.max(
    1,
    Math.ceil(SLOT_INCREMENT_MINUTES / MINUTE_STEP)
  );
  const totalSteps = timeline.length;

  const options = [];
  for (
    let startStep = 0;
    startStep + slotSteps <= totalSteps;
    startStep += incrementSteps
  ) {
    let maxOccupancy = 0;
    for (let idx = startStep; idx < startStep + slotSteps; idx += 1) {
      maxOccupancy = Math.max(maxOccupancy, timeline[idx]);
    }

    const remainingCapacity = Math.max(staffCount - maxOccupancy, 0);
    const startMinutes = WORK_START_MINUTE + startStep * MINUTE_STEP;
    const endMinutes =
      WORK_START_MINUTE + (startStep + slotSteps) * MINUTE_STEP;

    options.push({
      startMinutes,
      endMinutes,
      available: remainingCapacity > 0,
      remainingCapacity,
      label: formatTimeLabel(startMinutes, endMinutes),
    });
  }

  return options;
};

const createHttpError = (status, message) => {
  const error = new Error(message || "Unexpected error");
  error.status = status;
  return error;
};

const normalizeCouponCode = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
};

const normaliseAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(Math.round(numeric), 0);
};

const normaliseSignedAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric);
};

const normaliseCartService = (service) => {
  if (!service || typeof service !== "object") {
    return null;
  }

  const serviceIdRaw =
    service.serviceId ??
    service.id ??
    service._id ??
    service.slug ??
    service.name ??
    null;

  const serviceId = serviceIdRaw ? serviceIdRaw.toString() : null;
  const nameRaw = service.name || service.title;
  const name =
    typeof nameRaw === "string" && nameRaw.trim().length > 0
      ? nameRaw.trim()
      : "Service";

  const price = normaliseAmount(service.price ?? service.priceMin ?? 0);

  const durationRaw =
    service.durationMinutes ?? service.duration ?? service.duration_min;
  const duration = Number.isFinite(Number(durationRaw))
    ? Math.max(Math.round(Number(durationRaw)), 0)
    : 0;

  return {
    serviceId,
    name,
    price,
    durationMinutes: duration,
  };
};

const normaliseSchedule = (schedule) => {
  if (!schedule || typeof schedule !== "object") {
    return null;
  }

  const date =
    typeof schedule.date === "string" && schedule.date.trim().length > 0
      ? schedule.date.trim()
      : null;

  const startMinutes = Number(schedule.startMinutes);
  const endMinutes = Number(schedule.endMinutes);

  return {
    date,
    startMinutes: Number.isFinite(startMinutes)
      ? Math.round(startMinutes)
      : null,
    endMinutes: Number.isFinite(endMinutes) ? Math.round(endMinutes) : null,
    startTime:
      typeof schedule.startTime === "string" ? schedule.startTime : null,
    endTime: typeof schedule.endTime === "string" ? schedule.endTime : null,
    label: typeof schedule.label === "string" ? schedule.label : null,
  };
};

const normaliseCartItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const cartMain = normaliseCartService(item.cartMain);
  const cartExtras = Array.isArray(item.cartExtras)
    ? item.cartExtras
        .map((extra) => normaliseCartService(extra))
        .filter(Boolean)
    : [];

  const derivedTotal = normaliseAmount(
    (cartMain?.price ?? 0) +
      cartExtras.reduce((acc, extra) => acc + (extra.price ?? 0), 0)
  );
  const explicitTotal = normaliseAmount(item.price);
  const price = explicitTotal > 0 ? explicitTotal : derivedTotal;

  const derivedDuration =
    (cartMain?.durationMinutes ?? 0) +
    cartExtras.reduce((acc, extra) => acc + (extra.durationMinutes ?? 0), 0);

  const explicitDuration = Number(item.durationMinutes);
  const durationMinutes =
    Number.isFinite(explicitDuration) && explicitDuration > 0
      ? Math.round(explicitDuration)
      : derivedDuration;

  const entryIdRaw =
    item.entryId ??
    item.serviceId ??
    item.id ??
    cartMain?.serviceId ??
    item.name ??
    null;

  const entryId = entryIdRaw ? entryIdRaw.toString() : null;
  const nameRaw = item.name ?? cartMain?.name;
  const name =
    typeof nameRaw === "string" && nameRaw.trim().length > 0
      ? nameRaw.trim()
      : "Paket Layanan";

  return {
    entryId,
    name,
    price,
    durationMinutes,
    cartMain,
    cartExtras,
    schedule: normaliseSchedule(item.schedule),
  };
};

const normaliseCartItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => normaliseCartItem(item)).filter(Boolean);
};

const computeCartTotals = (items) => {
  let subtotal = 0;
  let totalDuration = 0;

  items.forEach((item) => {
    const linePrice = normaliseAmount(item.price);
    subtotal += linePrice;
    item.price = linePrice;

    const derivedDuration =
      (item.cartMain?.durationMinutes ?? 0) +
      item.cartExtras.reduce(
        (acc, extra) => acc + (extra.durationMinutes ?? 0),
        0
      );

    const lineDuration =
      Number.isFinite(item.durationMinutes) && item.durationMinutes > 0
        ? Math.round(item.durationMinutes)
        : derivedDuration;

    item.durationMinutes = lineDuration;
    totalDuration += lineDuration;
  });

  return {
    subtotal: normaliseAmount(subtotal),
    totalDuration: Math.max(Math.round(totalDuration), 0),
  };
};

const collectCartServiceIds = (items) => {
  const ids = new Set();
  items.forEach((item) => {
    const mainId = item?.cartMain?.serviceId;
    if (mainId) {
      ids.add(mainId.toString());
    }
    item?.cartExtras?.forEach((extra) => {
      if (extra?.serviceId) {
        ids.add(extra.serviceId.toString());
      }
    });
  });
  return ids;
};

const ensureCouponRules = async (coupon, cartItems, subtotal) => {
  if (!coupon || typeof coupon !== "object") {
    throw createHttpError(400, "Kupon tidak valid");
  }

  const now = new Date();

  if (!coupon.isActive) {
    throw createHttpError(400, "Kupon tidak aktif");
  }

  if (coupon.startDate && coupon.startDate > now) {
    throw createHttpError(400, "Kupon belum dapat digunakan");
  }

  if (coupon.endDate && coupon.endDate < now) {
    throw createHttpError(400, "Kupon telah kedaluwarsa");
  }

  const usageLimit = Number.isFinite(Number(coupon.usageLimit))
    ? Number(coupon.usageLimit)
    : null;
  const usedCount = Number.isFinite(Number(coupon.usedCount))
    ? Number(coupon.usedCount)
    : 0;

  if (usageLimit !== null && usageLimit >= 0 && usedCount >= usageLimit) {
    throw createHttpError(400, "Kupon telah mencapai batas penggunaan");
  }

  const minSpend = Number.isFinite(Number(coupon.minSpend))
    ? Number(coupon.minSpend)
    : 0;

  if (minSpend > 0 && subtotal < minSpend) {
    throw createHttpError(
      400,
      `Minimum transaksi untuk kupon ini adalah Rp ${minSpend.toLocaleString(
        "id-ID"
      )}`
    );
  }

  const serviceIdsInCart = Array.from(collectCartServiceIds(cartItems));

  if (Array.isArray(coupon.serviceIds) && coupon.serviceIds.length > 0) {
    const allowedServiceIds = coupon.serviceIds.map((id) =>
      id?.toString ? id.toString() : String(id)
    );

    const hasMatch = serviceIdsInCart.some((serviceId) =>
      allowedServiceIds.includes(serviceId)
    );

    if (!hasMatch) {
      throw createHttpError(
        400,
        "Kupon tidak berlaku untuk layanan yang dipilih"
      );
    }
  }

  if (Array.isArray(coupon.categoryIds) && coupon.categoryIds.length > 0) {
    if (!serviceIdsInCart.length) {
      throw createHttpError(
        400,
        "Kupon tidak dapat diterapkan pada layanan yang dipilih"
      );
    }

    const categoryIds = coupon.categoryIds.map((id) =>
      id?.toString ? id.toString() : String(id)
    );

    const relatedServices = await Service.find({
      _id: { $in: serviceIdsInCart },
    })
      .select("_id category")
      .lean();

    const hasCategoryMatch = relatedServices.some((service) => {
      if (!service) {
        return false;
      }
      const categoryValue =
        service.category && typeof service.category === "object"
          ? service.category._id ?? service.category.id
          : service.category;
      const categoryId = categoryValue?.toString?.();
      return categoryId ? categoryIds.includes(categoryId) : false;
    });

    if (!hasCategoryMatch) {
      throw createHttpError(
        400,
        "Kupon tidak berlaku untuk kategori layanan yang dipilih"
      );
    }
  }
};

const computeDiscountAmount = (coupon, subtotal) => {
  if (!coupon || subtotal <= 0) {
    return 0;
  }

  if (coupon.discountType === "percent") {
    const percent = Number(coupon.amount);
    if (!Number.isFinite(percent) || percent <= 0) {
      return 0;
    }
    const rawDiscount = (percent / 100) * subtotal;
    return Math.min(normaliseAmount(rawDiscount), normaliseAmount(subtotal));
  }

  const fixed = normaliseAmount(coupon.amount);
  return Math.min(fixed, normaliseAmount(subtotal));
};

const buildCartPricingSummary = async ({
  items,
  couponCode,
  requireCoupon = false,
}) => {
  const cartItems = normaliseCartItems(items);

  if (!cartItems.length) {
    throw createHttpError(400, "Keranjang masih kosong");
  }

  const { subtotal, totalDuration } = computeCartTotals(cartItems);

  if (subtotal <= 0) {
    throw createHttpError(400, "Total transaksi belum valid");
  }

  const normalisedCode = normalizeCouponCode(couponCode);
  let coupon = null;
  let discountAmount = 0;

  if (normalisedCode) {
    coupon = await Coupon.findOne({ code: normalisedCode });
    if (!coupon) {
      throw createHttpError(404, "Kupon tidak ditemukan");
    }
    await ensureCouponRules(coupon, cartItems, subtotal);
    discountAmount = computeDiscountAmount(coupon, subtotal);
  } else if (requireCoupon) {
    throw createHttpError(400, "Kode kupon wajib diisi");
  }

  const total = Math.max(subtotal - discountAmount, 0);

  return {
    items: cartItems,
    subtotal,
    totalDuration,
    coupon,
    discountAmount,
    total,
  };
};

let snapClientInstance = null;

const getSnapClient = () => {
  if (snapClientInstance) {
    return snapClientInstance;
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw createHttpError(500, "Midtrans belum dikonfigurasi");
  }

  const isProduction =
    (process.env.MIDTRANS_IS_PRODUCTION || "").toLowerCase() === "true";

  snapClientInstance = new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });

  return snapClientInstance;
};

const buildOrderId = (userId) => {
  const userSegment = userId
    ? userId.toString().slice(-6).toUpperCase()
    : "CUST";
  const timestampSegment = Date.now().toString().slice(-10);
  const randomSegment = randomUUID()
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();
  const raw = `ORD-${userSegment}-${timestampSegment}-${randomSegment}`;
  return raw.slice(0, 50);
};

const getAppBaseUrl = (req) => {
  const configuredBaseUrl =
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_BASE_URL ||
    process.env.WEB_APP_BASE_URL ||
    process.env.PUBLIC_WEB_URL;

  const originHeader = req?.headers?.origin;
  const refererHeader = req?.headers?.referer;

  const candidate = configuredBaseUrl || originHeader || refererHeader;

  if (!candidate || typeof candidate !== "string") {
    return null;
  }

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch (error) {
    console.warn("Invalid app base URL for Midtrans callbacks", {
      candidate,
      message: error?.message,
    });
    return null;
  }
};

const buildAppUrl = (req, path) => {
  if (!path) {
    return null;
  }

  const base = getAppBaseUrl(req);
  if (!base) {
    return null;
  }

  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalisedPath}`;
};

const buildSnapCallbacks = (req) => {
  const callbacks = {
    finish: buildAppUrl(req, "/customer/history?payment=success"),
    pending: buildAppUrl(req, "/customer/history?payment=pending"),
    error: buildAppUrl(req, "/customer/cart?payment=error"),
  };

  Object.keys(callbacks).forEach((key) => {
    if (!callbacks[key]) {
      delete callbacks[key];
    }
  });

  return callbacks;
};

const parseClockToMinutes = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const resolveScheduleFromCart = (cartItems, totalDurationMinutes) => {
  const candidate = cartItems.find((item) => item?.schedule?.date) || null;
  const date = candidate?.schedule?.date || toDateKey(new Date());

  const scheduleMinutes =
    candidate?.schedule?.startMinutes ??
    parseClockToMinutes(candidate?.schedule?.startTime);

  const startMinutes = Number.isFinite(scheduleMinutes)
    ? Math.max(0, Math.round(scheduleMinutes))
    : WORK_START_MINUTE;

  const duration = Number.isFinite(totalDurationMinutes)
    ? Math.max(0, Math.round(totalDurationMinutes))
    : 0;

  const base = new Date(`${date}T00:00:00Z`);
  const startTime = new Date(base.getTime() + startMinutes * 60 * 1000);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  return {
    date,
    startMinutes,
    endMinutes: startMinutes + duration,
    startTime,
    endTime,
  };
};

const buildBookedServicesFromCart = (cartItems) => {
  const services = [];

  cartItems.forEach((item) => {
    if (item.cartMain) {
      services.push({
        service: isValidObjectId(item.cartMain.serviceId)
          ? item.cartMain.serviceId
          : undefined,
        name: item.cartMain.name,
        price: item.cartMain.price,
        durationMinutes: item.cartMain.durationMinutes,
      });
    }

    item.cartExtras.forEach((extra) => {
      services.push({
        service: isValidObjectId(extra.serviceId) ? extra.serviceId : undefined,
        name: extra.name,
        price: extra.price,
        durationMinutes: extra.durationMinutes,
      });
    });
  });

  return services;
};

const normaliseMidtransStatus = (status) => {
  if (!status) return "pending";
  const lowered = status.toString().toLowerCase();
  switch (lowered) {
    case "settlement":
    case "capture":
    case "paid":
    case "success":
      return "paid";
    case "cancel":
    case "cancelled":
      return "cancelled";
    case "failure":
    case "failed":
    case "deny":
      return "failed";
    case "expire":
    case "expired":
      return "expired";
    default:
      return "pending";
  }
};

const updateBookingPaymentFromTransaction = async (booking, transaction) => {
  if (!booking || !transaction) return;

  booking.payment ??= {};
  booking.payment.method = transaction.method || "midtrans";
  booking.payment.totalAmount =
    transaction.amount ?? booking.payment.totalAmount;
  booking.payment.invoiceNo =
    transaction.invoice?.number || booking.payment.invoiceNo;
  booking.payment.reference =
    transaction.reference || transaction.orderId || booking.payment.reference;

  switch (transaction.status) {
    case "paid":
      booking.payment.status = "paid";
      break;
    case "cancelled":
    case "failed":
    case "voided":
      booking.payment.status = "refunded";
      break;
    case "expired":
    case "overdue":
      booking.payment.status = "unpaid";
      break;
    default:
      booking.payment.status = "pending";
      break;
  }

  await booking.save();
};

const upsertBookingAndTransaction = async ({
  user,
  orderId,
  summary,
  cartItems,
  snapTransaction,
}) => {
  if (!user?._id) {
    throw createHttpError(401, "Sesi tidak valid");
  }

  let booking = await Booking.findOne({ "payment.reference": orderId });

  const { date, startTime, endTime } = resolveScheduleFromCart(
    cartItems,
    summary.totalDuration
  );

  const services = buildBookedServicesFromCart(cartItems);

  if (!booking) {
    booking = new Booking({
      user: user._id,
      services,
      startTime,
      endTime,
      status: "pending",
      slot: { date },
      payment: {
        method: "midtrans",
        status: "pending",
        totalAmount: summary.total,
        reference: orderId,
      },
      notes: undefined,
    });

    await booking.save();
  }

  let transaction = await Transaction.findOne({ orderId });

  if (!transaction) {
    transaction = new Transaction({
      booking: booking._id,
      user: user._id,
      amount: summary.total,
      method: "midtrans",
      status: "pending",
      reference: orderId,
      orderId,
      bookedServices: services.map((svc) => ({
        serviceId: svc.service,
        name: svc.name,
        price: svc.price,
        durationMinutes: svc.durationMinutes,
      })),
      metadata: {
        couponCode: summary.coupon?.code ?? null,
        subtotal: summary.subtotal,
        discountAmount: summary.discountAmount,
      },
    });
  }

  if (snapTransaction) {
    transaction.orderId = snapTransaction.order_id ?? transaction.orderId;
    transaction.reference = snapTransaction.order_id ?? transaction.reference;
    transaction.paymentType =
      snapTransaction.payment_type ?? transaction.paymentType;
    transaction.grossAmount =
      snapTransaction.gross_amount !== undefined
        ? Number(snapTransaction.gross_amount)
        : transaction.grossAmount;
    transaction.midtransResponse = snapTransaction;
    transaction.status = normaliseMidtransStatus(
      snapTransaction.transaction_status
    );
  }

  await transaction.save();
  await updateBookingPaymentFromTransaction(booking, transaction);

  return { booking, transaction };
};

const buildCustomerDetails = (user) => {
  if (!user) {
    return { first_name: "Customer" };
  }

  const fullName = user.fullName?.trim?.();
  let firstName = "Customer";
  let lastName;

  if (fullName) {
    const parts = fullName.split(/\s+/);
    firstName = parts.shift() || fullName;
    if (parts.length) {
      lastName = parts.join(" ");
    }
  } else if (user.email) {
    firstName = user.email.split("@")[0];
  }

  const payload = { first_name: firstName };

  if (lastName) {
    payload.last_name = lastName;
  }
  if (user.email) {
    payload.email = user.email;
  }
  if (user.phone) {
    payload.phone = user.phone;
  }

  return payload;
};

const buildSnapItemDetails = (cartItems, subtotal, discountAmount, coupon) => {
  const details = [];
  let accumulatedSubtotal = 0;

  cartItems.forEach((item, index) => {
    let lineTotal = 0;

    const mainPrice = normaliseAmount(item.cartMain?.price ?? 0);
    if (item.cartMain && mainPrice > 0) {
      details.push({
        id: `MAIN-${item.cartMain.serviceId || index + 1}`,
        name: item.cartMain.name || item.name || `Layanan ${index + 1}`,
        price: mainPrice,
        quantity: 1,
      });
      lineTotal += mainPrice;
    }

    item.cartExtras.forEach((extra, extraIndex) => {
      const extraPrice = normaliseAmount(extra.price);
      if (extraPrice <= 0) {
        return;
      }
      details.push({
        id: `EXTRA-${extra.serviceId || `${index + 1}-${extraIndex + 1}`}`,
        name: extra.name || `Extra ${extraIndex + 1}`,
        price: extraPrice,
        quantity: 1,
      });
      lineTotal += extraPrice;
    });

    const resolvedPrice = normaliseAmount(item.price);
    if (resolvedPrice > lineTotal) {
      const delta = normaliseAmount(resolvedPrice - lineTotal);
      if (delta > 0) {
        details.push({
          id: `PKG-${index + 1}`,
          name: item.name || `Paket ${index + 1}`,
          price: delta,
          quantity: 1,
        });
        lineTotal += delta;
      }
    } else if (lineTotal > resolvedPrice) {
      const delta = normaliseAmount(lineTotal - resolvedPrice);
      if (delta > 0) {
        details.push({
          id: `PKG-ADJ-${index + 1}`,
          name: `Penyesuaian Paket ${index + 1}`,
          price: -delta,
          quantity: 1,
        });
        lineTotal -= delta;
      }
    }

    if (lineTotal === 0 && resolvedPrice > 0) {
      details.push({
        id: `PKG-${index + 1}`,
        name: item.name || `Paket ${index + 1}`,
        price: resolvedPrice,
        quantity: 1,
      });
      lineTotal = resolvedPrice;
    }

    accumulatedSubtotal += lineTotal;
  });

  const subtotalDelta = normaliseSignedAmount(subtotal - accumulatedSubtotal);
  if (subtotalDelta !== 0) {
    details.push({
      id: subtotalDelta > 0 ? "SUBTOTAL-ADJUST" : "SUBTOTAL-CORRECT",
      name: subtotalDelta > 0 ? "Penyesuaian Subtotal" : "Koreksi Subtotal",
      price: subtotalDelta,
      quantity: 1,
    });
    accumulatedSubtotal += subtotalDelta;
  }

  if (discountAmount > 0) {
    details.push({
      id: "COUPON-DISCOUNT",
      name: coupon ? `Diskon Kupon ${coupon.code}` : "Diskon",
      price: -normaliseAmount(discountAmount),
      quantity: 1,
    });
  }

  return details;
};

const router = express.Router();

const ACTIVE_STATUSES = ["pending", "confirmed", "in-progress"];
const normalizeEmail = (email) => email?.toLowerCase?.().trim?.() ?? email;

const SETTINGS_NOTIFICATION_KEYS = [
  "email",
  "sms",
  "push",
  "bookingReminders",
  "promotions",
  "newsletter",
];

const DEFAULT_NOTIFICATION_PREFS = {
  email: true,
  sms: false,
  push: true,
  bookingReminders: true,
  promotions: false,
  newsletter: true,
};

const DEACTIVATION_GRACE_DAYS = 30;

const extractNotificationPrefs = (user) => {
  const raw =
    user?.notificationPrefs &&
    typeof user.notificationPrefs.toObject === "function"
      ? user.notificationPrefs.toObject()
      : user?.notificationPrefs || {};

  const prefs = { ...DEFAULT_NOTIFICATION_PREFS };
  SETTINGS_NOTIFICATION_KEYS.forEach((key) => {
    if (raw[key] !== undefined) {
      prefs[key] = Boolean(raw[key]);
    }
  });

  return prefs;
};

const buildSettingsResponse = (user) => ({
  theme: user?.preferences?.theme === "dark" ? "dark" : "light",
  darkMode: user?.preferences?.theme === "dark",
  notificationPrefs: extractNotificationPrefs(user),
  status: user?.status ?? "active",
  deactivation: user?.deactivation ?? null,
  updatedAt: user?.updatedAt ?? null,
});

router.use(authenticate);
router.use(authorizeRoles("customer"));

router.get("/availability", async (req, res) => {
  try {
    const { month, date: dateParam, durationMinutes } = req.query ?? {};

    const targetMonth =
      parseMonthParam(month) ??
      (() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      })();

    const startOfMonth = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth() + 1,
      0
    );

    const monthStartKey = toDateKey(startOfMonth);
    const monthEndKey = toDateKey(endOfMonth);

    const slotDurationRequested = Number.parseInt(durationMinutes, 10);
    const effectiveSlotDuration = Number.isFinite(slotDurationRequested)
      ? Math.max(slotDurationRequested, MINUTE_STEP)
      : 60;

    const [staffCountRaw, bookings] = await Promise.all([
      User.countDocuments({
        staffProfile: { $exists: true, $ne: null },
      }),
      Booking.find({
        "slot.date": { $gte: monthStartKey, $lte: monthEndKey },
        status: { $ne: "cancelled" },
      })
        .select("slot.date startTime endTime")
        .lean(),
    ]);

    const staffCount = Math.max(staffCountRaw, 0);
    const effectiveStaff = Math.max(staffCount, 1);

    const bookingsByDate = new Map();
    bookings.forEach((booking) => {
      const dateKey = booking?.slot?.date;
      if (!dateKey) {
        return;
      }

      const startMinutes = minutesFromDate(booking.startTime);
      const endMinutes = minutesFromDate(booking.endTime);

      if (startMinutes === null || endMinutes === null) {
        return;
      }

      const currentList = bookingsByDate.get(dateKey) || [];
      currentList.push({ startMinutes, endMinutes });
      bookingsByDate.set(dateKey, currentList);
    });

    const days = [];
    const iterator = new Date(startOfMonth);

    while (iterator <= endOfMonth) {
      const dateKey = toDateKey(iterator);
      const dayOfWeek = iterator.getDay();
      const isClosed =
        dayOfWeek === CLOSED_DAY_INDEX || staffCount === 0 ? true : false;
      const bookingsForDay = bookingsByDate.get(dateKey) || [];

      const totalBookedMinutes = bookingsForDay.reduce((acc, entry) => {
        const start = clampToWorkday(entry.startMinutes) ?? WORK_START_MINUTE;
        const end = clampToWorkday(entry.endMinutes) ?? WORK_END_MINUTE;
        const span = Math.max(end - start, 0);
        return acc + span;
      }, 0);

      const totalCapacityMinutes = isClosed
        ? 0
        : effectiveStaff * WORK_MINUTES_PER_STAFF;
      const remainingMinutes = Math.max(
        totalCapacityMinutes - totalBookedMinutes,
        0
      );

      const fitsRequest =
        !isClosed &&
        (slotDurationRequested > 0
          ? remainingMinutes >= effectiveSlotDuration
          : remainingMinutes > 0);

      let status = "available";
      if (isClosed || remainingMinutes === 0) {
        status = "full";
      } else if (!fitsRequest) {
        status = "partial";
      }

      days.push({
        date: dateKey,
        dayOfWeek,
        isClosed,
        remainingMinutes,
        fitsRequest,
        status,
      });

      iterator.setDate(iterator.getDate() + 1);
    }

    const selectedDateKey =
      (typeof dateParam === "string" && dateParam.trim().length > 0
        ? dateParam.trim()
        : null) || null;

    let slots = null;

    if (selectedDateKey) {
      const slotsBookings = bookingsByDate.get(selectedDateKey) || [];
      const slotsTimeline = buildTimeline(slotsBookings);
      const slotOptions = buildSlotOptions({
        timeline: slotsTimeline,
        slotDuration: effectiveSlotDuration,
        staffCount,
      });

      slots = {
        date: selectedDateKey,
        slotDurationMinutes: effectiveSlotDuration,
        incrementMinutes: SLOT_INCREMENT_MINUTES,
        options: slotOptions,
      };
    }

    res.json({
      month: {
        year: targetMonth.getFullYear(),
        month: targetMonth.getMonth() + 1,
      },
      staff: {
        totalStaff: staffCount,
        minutesPerStaff: WORK_MINUTES_PER_STAFF,
        workStart: formatTimePoint(WORK_START_MINUTE),
        workEnd: formatTimePoint(WORK_END_MINUTE),
      },
      days,
      slots,
    });
  } catch (error) {
    console.error("Failed to load availability", error);
    res.status(500).json({ message: "Failed to load availability" });
  }
});

router.get("/services", async (req, res) => {
  try {
    const { search, categoryId } = req.query ?? {};

    const filter = { active: true };

    if (search && typeof search === "string") {
      const trimmed = search.trim();
      if (trimmed.length > 0) {
        const regex = new RegExp(trimmed, "i");
        filter.$or = [{ name: regex }, { description: regex }];
      }
    }

    if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: "Invalid category id" });
      }
      filter.category = categoryId;
    }

    const services = await Service.find(filter)
      .populate("category", "name slug")
      .sort({ featured: -1, createdAt: -1 });

    res.json({ services: buildServicesResponse(services) });
  } catch (error) {
    console.error("Failed to load customer services", error);
    res.status(500).json({ message: "Failed to load services" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: buildUserPayload(user) });
  } catch (error) {
    console.error("Failed to load customer profile", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const { fullName, email, phone, avatarUrl } = req.body ?? {};

    if (
      [fullName, email, phone, avatarUrl].every((value) => value === undefined)
    ) {
      return res
        .status(400)
        .json({ message: "No profile fields were provided" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }

      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });
        if (existing) {
          return res.status(409).json({ message: "Email is already in use" });
        }
        user.email = normalizedEmail;
      }
    }

    if (fullName !== undefined) {
      if (!fullName) {
        return res.status(400).json({ message: "Full name cannot be empty" });
      }
      user.fullName = fullName;
    }

    if (phone !== undefined) {
      if (!phone) {
        return res
          .status(400)
          .json({ message: "Phone number cannot be empty" });
      }
      user.phone = phone;
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl || null;
    }

    await user.save();
    req.user = user;

    res.json({ user: buildUserPayload(user) });
  } catch (error) {
    console.error("Failed to update customer profile", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.post("/profile/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Failed to update password", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user._id;

    const baseFilter = { user: userId };

    const [
      totalBookings,
      activeBookings,
      completedServices,
      recentBookings,
      upcomingBooking,
    ] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.countDocuments({
        user: userId,
        status: { $in: ACTIVE_STATUSES },
      }),
      Booking.countDocuments({ user: userId, status: "completed" }),
      Booking.find(baseFilter)
        .sort({ startTime: -1 })
        .limit(10)
        .populate("stylist", "fullName avatarUrl phone")
        .lean(),
      Booking.findOne({
        user: userId,
        status: { $in: ACTIVE_STATUSES },
        startTime: { $gte: new Date() },
      })
        .sort({ startTime: 1 })
        .populate("stylist", "fullName avatarUrl phone")
        .lean(),
    ]);

    res.json({
      stats: {
        totalBookings,
        activeBookings,
        completedServices,
      },
      recentBookings: buildBookingsResponse(recentBookings),
      upcomingBooking: upcomingBooking
        ? buildBookingPayload(upcomingBooking)
        : null,
    });
  } catch (error) {
    console.error("Failed to load customer dashboard", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

router.get("/bookings", async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      status,
      page: pageParam = "1",
      limit: limitParam = "10",
      sort = "desc",
    } = req.query ?? {};

    const parsedPage = Number.parseInt(pageParam, 10);
    const parsedLimit = Number.parseInt(limitParam, 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limitBase =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const limit = Math.min(Math.max(limitBase, 1), 100);

    const normalizedStatus =
      typeof status === "string" ? status.trim().toLowerCase() : "";

    const now = new Date();

    const statusFilter = {};

    if (normalizedStatus && normalizedStatus !== "all") {
      if (normalizedStatus === "upcoming") {
        statusFilter.status = { $in: ACTIVE_STATUSES };
        statusFilter.startTime = { $gte: now };
      } else if (normalizedStatus === "completed") {
        statusFilter.status = "completed";
      } else if (normalizedStatus === "cancelled") {
        statusFilter.status = "cancelled";
      } else {
        statusFilter.status = normalizedStatus;
      }
    }

    const baseFilter = { user: userId, ...statusFilter };

    const sortOrder = sort === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [
      bookings,
      totalForFilter,
      totalCount,
      upcomingCount,
      completedCount,
      cancelledCount,
    ] = await Promise.all([
      Booking.find(baseFilter)
        .sort({ startTime: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("stylist", "fullName email phone avatarUrl")
        .populate("services.service", "name")
        .lean(),
      Booking.countDocuments(baseFilter),
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({
        user: userId,
        status: { $in: ACTIVE_STATUSES },
        startTime: { $gte: now },
      }),
      Booking.countDocuments({ user: userId, status: "completed" }),
      Booking.countDocuments({ user: userId, status: "cancelled" }),
    ]);

    const totalPages =
      totalForFilter > 0 ? Math.ceil(totalForFilter / limit) : 0;

    res.json({
      bookings: buildBookingsResponse(bookings),
      pagination: {
        page,
        limit,
        total: totalForFilter,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
      stats: {
        total: totalCount,
        upcoming: upcomingCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    });
  } catch (error) {
    console.error("Failed to load customer bookings", error);
    res.status(500).json({ message: "Failed to load bookings" });
  }
});

router.get("/settings", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ settings: buildSettingsResponse(user) });
  } catch (error) {
    console.error("Failed to load customer settings", error);
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { darkMode, theme, notificationPrefs } = req.body ?? {};
    let hasChanges = false;

    if (typeof darkMode === "boolean" || typeof theme === "string") {
      const resolvedTheme =
        typeof theme === "string"
          ? theme.toLowerCase() === "dark"
            ? "dark"
            : "light"
          : darkMode
          ? "dark"
          : "light";
      user.preferences ??= {};
      if (user.preferences.theme !== resolvedTheme) {
        user.preferences.theme = resolvedTheme;
        hasChanges = true;
      }
    }

    if (notificationPrefs && typeof notificationPrefs === "object") {
      user.notificationPrefs ??= {};
      SETTINGS_NOTIFICATION_KEYS.forEach((key) => {
        if (notificationPrefs[key] !== undefined) {
          const nextValue = Boolean(notificationPrefs[key]);
          if (user.notificationPrefs[key] !== nextValue) {
            user.notificationPrefs[key] = nextValue;
            hasChanges = true;
          }
        }
      });
    }

    if (!hasChanges) {
      return res
        .status(400)
        .json({ message: "No settings changes were provided" });
    }

    await user.save();
    req.user = user;

    res.json({
      settings: buildSettingsResponse(user),
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Failed to update customer settings", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

router.post("/settings/deactivate", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { reason } = req.body ?? {};
    const trimmedReason =
      typeof reason === "string" && reason.trim().length > 0
        ? reason.trim()
        : null;
    const requestedAt = new Date();
    const expiresAt = new Date(
      requestedAt.getTime() + DEACTIVATION_GRACE_DAYS * 24 * 60 * 60 * 1000
    );

    user.status = "inactive";
    user.deactivation = {
      reason: trimmedReason,
      requestedAt,
      expiresAt,
    };

    await user.save();
    req.user = user;

    res.json({
      message:
        "Account deactivated successfully. You can reactivate within 30 days.",
      user: buildUserPayload(user),
      settings: buildSettingsResponse(user),
    });
  } catch (error) {
    console.error("Failed to deactivate account", error);
    res.status(500).json({ message: "Failed to deactivate account" });
  }
});

router.post("/cart/redeem-coupon", async (req, res) => {
  try {
    const { code, items } = req.body ?? {};

    const summary = await buildCartPricingSummary({
      items,
      couponCode: code,
      requireCoupon: true,
    });

    res.json({
      coupon: buildCouponPayload(summary.coupon),
      subtotal: summary.subtotal,
      discountAmount: summary.discountAmount,
      total: summary.total,
      totalDuration: summary.totalDuration,
    });
  } catch (error) {
    const status = error?.status || 500;
    console.error("Failed to redeem coupon", error);
    res.status(status).json({
      message: error?.message || "Gagal memeriksa kupon",
    });
  }
});

router.post("/checkout/snap-token", async (req, res) => {
  try {
    const { items, couponCode } = req.body ?? {};

    const summary = await buildCartPricingSummary({
      items,
      couponCode,
    });

    if (summary.total <= 0) {
      throw createHttpError(400, "Total transaksi tidak valid untuk diproses");
    }

    const snap = getSnapClient();
    const orderId = buildOrderId(req.user?._id);

    const itemDetails = buildSnapItemDetails(
      summary.items,
      summary.subtotal,
      summary.discountAmount,
      summary.coupon
    );

    const callbacks = buildSnapCallbacks(req);

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: summary.total,
      },
      item_details: itemDetails,
      customer_details: buildCustomerDetails(req.user),
      credit_card: { secure: true },
      custom_field1: req.user?._id?.toString(),
      custom_field2: summary.coupon?.code ?? undefined,
    };

    if (Object.keys(callbacks).length) {
      parameter.callbacks = callbacks;
    }

    const transaction = await snap.createTransaction(parameter);

    if (!transaction?.token) {
      throw createHttpError(502, "Midtrans tidak mengembalikan token");
    }

    await upsertBookingAndTransaction({
      user: req.user,
      orderId,
      summary,
      cartItems: summary.items,
      snapTransaction: transaction,
    });

    res.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
      subtotal: summary.subtotal,
      discountAmount: summary.discountAmount,
      total: summary.total,
      coupon: summary.coupon ? buildCouponPayload(summary.coupon) : null,
    });
  } catch (error) {
    const status = error?.status || (error?.ApiResponse ? 502 : 500);
    console.error(
      "Failed to create Midtrans token",
      error?.ApiResponse || error
    );
    res.status(status).json({
      message: error?.message || "Gagal membuat token pembayaran Midtrans",
    });
  }
});

export default router;
