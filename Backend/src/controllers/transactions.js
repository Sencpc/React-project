import express from "express";
import { createHash } from "node:crypto";
import { isValidObjectId } from "mongoose";
import Transaction from "../models/Transaction.js";
import Booking from "../models/Booking.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import {
  buildTransactionPayload,
  buildTransactionsResponse,
  buildTransactionStats,
} from "../utils/serializers.js";

const router = express.Router();

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normaliseStatus = (status) => {
  if (!status) return undefined;
  const lowered = status.toString().toLowerCase();
  switch (lowered) {
    case "settlement":
    case "capture":
    case "paid":
    case "done":
    case "success":
      return "paid";
    case "pending":
    case "draft":
      return "pending";
    case "cancel":
    case "cancelled":
      return "cancelled";
    case "failure":
    case "failed":
      return "failed";
    case "void":
    case "voided":
      return "voided";
    case "expire":
    case "expired":
      return "expired";
    case "overdue":
      return "overdue";
    case "refunded":
    case "refund":
      return "refunded";
    default:
      return lowered;
  }
};

const applyInvoiceDetails = (transaction, invoice) => {
  if (!invoice || typeof invoice !== "object") {
    return transaction;
  }

  transaction.orderId = invoice.order_id ?? transaction.orderId;
  transaction.reference = invoice.reference ?? transaction.reference;
  transaction.paymentType = invoice.payment_type ?? transaction.paymentType;
  transaction.grossAmount =
    invoice.gross_amount !== undefined
      ? Number(invoice.gross_amount)
      : transaction.grossAmount;
  transaction.amount =
    invoice.gross_amount !== undefined
      ? Number(invoice.gross_amount)
      : transaction.amount;

  transaction.invoice = {
    id: invoice.id ?? transaction.invoice?.id,
    number: invoice.invoice_number ?? transaction.invoice?.number,
    title: invoice.invoice_title ?? transaction.invoice?.title,
    paidTitle: invoice.invoice_paid_title ?? transaction.invoice?.paidTitle,
    publishedAt:
      parseDate(invoice.published_date) ?? transaction.invoice?.publishedAt,
    dueDate: parseDate(invoice.due_date) ?? transaction.invoice?.dueDate,
    invoiceDate:
      parseDate(invoice.invoice_date) ?? transaction.invoice?.invoiceDate,
    pdfUrl: invoice.pdf_url ?? transaction.invoice?.pdfUrl,
    paymentLinkUrl:
      invoice.payment_link_url ?? transaction.invoice?.paymentLinkUrl,
  };

  if (invoice.customer_details) {
    transaction.customer = {
      customerId: invoice.customer_details.id,
      name: invoice.customer_details.name,
      email: invoice.customer_details.email,
      phone: invoice.customer_details.phone,
    };
  }

  if (Array.isArray(invoice.item_details)) {
    transaction.items = invoice.item_details.map((item) => ({
      itemId: item.item_id ?? item.id,
      name: item.name ?? item.description,
      description: item.description,
      quantity: item.quantity !== undefined ? Number(item.quantity) : undefined,
      price: item.price !== undefined ? Number(item.price) : undefined,
      total: item.total !== undefined ? Number(item.total) : undefined,
    }));
  }

  if (Array.isArray(invoice.virtual_accounts)) {
    transaction.virtualAccounts = invoice.virtual_accounts.map((va) => ({
      bank: va.bank,
      vaNumber: va.va_number ?? va.vaNumber,
      paymentCode: va.payment_code ?? va.paymentCode,
      billerCode: va.biller_code ?? va.billerCode,
      channel: va.channel,
      grossAmount:
        va.gross_amount !== undefined ? Number(va.gross_amount) : undefined,
      expiresAt: parseDate(va.expiration_date ?? va.expires_at),
    }));
  }

  transaction.midtransResponse = invoice;

  const status = normaliseStatus(invoice.status);
  if (status) {
    transaction.status = status;
  }

  return transaction;
};

const snapshotBookedServices = (booking) =>
  Array.isArray(booking?.services)
    ? booking.services.map((serviceItem) => ({
        serviceId: serviceItem.service,
        name: serviceItem.name,
        price: serviceItem.price,
        durationMinutes: serviceItem.durationMinutes,
      }))
    : [];

const updateBookingPayment = async (booking, transaction) => {
  if (!booking) return;

  if (!booking.payment) {
    booking.payment = {
      method: transaction.method,
      totalAmount: transaction.amount,
      status: transaction.status === "paid" ? "paid" : "pending",
      invoiceNo: transaction.invoice?.number,
      reference: transaction.reference ?? transaction.orderId,
    };
  } else {
    booking.payment.method = transaction.method ?? booking.payment.method;
    booking.payment.totalAmount =
      transaction.amount ?? booking.payment.totalAmount;
    booking.payment.invoiceNo =
      transaction.invoice?.number ?? booking.payment.invoiceNo;
    booking.payment.reference =
      transaction.reference ?? transaction.orderId ?? booking.payment.reference;

    switch (transaction.status) {
      case "paid":
        booking.payment.status = "paid";
        break;
      case "failed":
      case "cancelled":
      case "voided":
        booking.payment.status = "refunded";
        break;
      case "pending":
      case "draft":
        booking.payment.status = "pending";
        break;
      case "expired":
      case "overdue":
        booking.payment.status = "unpaid";
        break;
      default:
        break;
    }
  }

  await booking.save();
};

// Midtrans HTTP notification (webhook)
router.post("/midtrans-notify", async (req, res) => {
  try {
    const payload = req.body ?? {};
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return res.status(500).json({ message: "Midtrans server key missing" });
    }

    const {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
    } = payload;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return res
        .status(400)
        .json({ message: "Invalid Midtrans notification payload" });
    }

    const rawSignature = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const expectedSignature = createHash("sha512")
      .update(rawSignature)
      .digest("hex");

    if (expectedSignature !== signatureKey) {
      return res.status(401).json({ message: "Invalid Midtrans signature" });
    }

    let transaction = await Transaction.findOne({ orderId });
    let booking = null;

    if (!transaction) {
      booking = await Booking.findOne({ "payment.reference": orderId });
      if (booking) {
        transaction = new Transaction({
          booking: booking._id,
          user: booking.user,
          amount: Number(grossAmount) || 0,
          method: "midtrans",
          status: "pending",
          orderId,
          reference: orderId,
        });
      }
    }

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const applied = applyInvoiceDetails(transaction, payload);

    let status = normaliseStatus(payload.transaction_status) || applied.status;
    if (
      payload.transaction_status === "capture" &&
      payload.fraud_status === "challenge"
    ) {
      status = "pending";
    }

    transaction.status = status;
    transaction.midtransResponse = payload;

    await transaction.save();

    if (!booking) {
      booking = await Booking.findById(transaction.booking);
    }

    if (booking) {
      await updateBookingPayment(booking, transaction);
    }

    res.json({ received: true, orderId, status: transaction.status });
  } catch (error) {
    console.error("Failed to process Midtrans notification", error);
    res
      .status(500)
      .json({ message: "Failed to process Midtrans notification" });
  }
});

router.use(authenticate);
router.use(authorizeRoles("admin"));

const buildFilter = (query) => {
  const filter = {};
  if (query.status) {
    const statuses = query.status
      .split(",")
      .map((value) => normaliseStatus(value.trim()))
      .filter(Boolean);
    if (statuses.length === 1) {
      filter.status = statuses[0];
    } else if (statuses.length > 1) {
      filter.status = { $in: statuses };
    }
  }

  if (query.paymentType) {
    filter.paymentType = query.paymentType;
  }

  if (query.bookingId && isValidObjectId(query.bookingId)) {
    filter.booking = query.bookingId;
  }

  if (query.orderId) {
    filter.orderId = query.orderId;
  }

  if (query.reference) {
    filter.reference = query.reference;
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) {
      const from = parseDate(query.dateFrom);
      if (from) filter.createdAt.$gte = from;
    }
    if (query.dateTo) {
      const to = parseDate(query.dateTo);
      if (to) filter.createdAt.$lte = to;
    }
    if (!Object.keys(filter.createdAt).length) {
      delete filter.createdAt;
    }
  }

  if (query.search) {
    const regex = new RegExp(query.search.trim(), "i");
    filter.$or = [
      { orderId: regex },
      { reference: regex },
      { "invoice.number": regex },
      { "customer.name": regex },
      { "customer.email": regex },
    ];
  }

  return filter;
};

const populateTransaction = (query) =>
  query.populate("user", "fullName email phone role avatarUrl").populate({
    path: "booking",
    select: "status payment startTime endTime slot",
  });

router.get("/", async (req, res) => {
  try {
    const filter = buildFilter(req.query ?? {});
    const transactionsQuery = populateTransaction(
      Transaction.find(filter).sort({ createdAt: -1 })
    );

    const transactions = await transactionsQuery.exec();

    res.json({
      transactions: buildTransactionsResponse(transactions),
      stats: buildTransactionStats(transactions),
    });
  } catch (error) {
    console.error("Failed to fetch transactions", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const transaction = await populateTransaction(
      Transaction.findById(id)
    ).exec();

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ transaction: buildTransactionPayload(transaction) });
  } catch (error) {
    console.error("Failed to fetch transaction", error);
    res.status(500).json({ message: "Failed to fetch transaction" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      bookingId,
      userId,
      amount,
      method,
      status,
      reference,
      paymentType,
      orderId,
      metadata,
      midtransInvoice,
    } = req.body ?? {};

    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    if (!midtransInvoice || typeof midtransInvoice !== "object") {
      return res
        .status(400)
        .json({ message: "midtransInvoice payload is required" });
    }

    const booking = await Booking.findById(bookingId).populate("user", "_id");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const resolvedUserId =
      userId && isValidObjectId(userId)
        ? userId
        : booking.user?._id?.toString();

    if (!resolvedUserId) {
      return res
        .status(400)
        .json({ message: "Unable to resolve transaction user" });
    }

    const transaction = new Transaction({
      booking: booking._id,
      user: resolvedUserId,
      amount:
        amount !== undefined
          ? Number(amount)
          : Number(midtransInvoice.gross_amount ?? 0),
      method: method ?? "midtrans",
      status:
        normaliseStatus(status) ??
        normaliseStatus(midtransInvoice.status) ??
        "pending",
      reference: reference ?? midtransInvoice.reference,
      paymentType: paymentType ?? midtransInvoice.payment_type,
      orderId: orderId ?? midtransInvoice.order_id,
      metadata,
      bookedServices: snapshotBookedServices(booking),
    });

    applyInvoiceDetails(transaction, midtransInvoice);

    await transaction.save();

    await updateBookingPayment(booking, transaction);

    const populatedTransaction = await populateTransaction(
      Transaction.findById(transaction._id)
    ).exec();

    res.status(201).json({
      transaction: buildTransactionPayload(populatedTransaction),
    });
  } catch (error) {
    console.error("Failed to create transaction", error);
    res.status(500).json({ message: "Failed to create transaction" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const {
      status,
      reference,
      paymentType,
      orderId,
      metadata,
      amount,
      method,
      midtransInvoice,
    } = req.body ?? {};

    if (status) {
      const normalized = normaliseStatus(status);
      if (normalized) {
        transaction.status = normalized;
      }
    }

    if (reference) transaction.reference = reference;
    if (paymentType) transaction.paymentType = paymentType;
    if (orderId) transaction.orderId = orderId;
    if (metadata) transaction.metadata = metadata;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (method) transaction.method = method;

    if (midtransInvoice) {
      applyInvoiceDetails(transaction, midtransInvoice);
    }

    await transaction.save();

    if (transaction.booking) {
      const booking = await Booking.findById(transaction.booking);
      if (booking) {
        await updateBookingPayment(booking, transaction);
      }
    }

    const populatedTransaction = await populateTransaction(
      Transaction.findById(transaction._id)
    ).exec();

    res.json({ transaction: buildTransactionPayload(populatedTransaction) });
  } catch (error) {
    console.error("Failed to update transaction", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

export default router;
