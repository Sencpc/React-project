import express from "express";
import Booking from "../models/Booking.js";
import Coupon from "../models/Coupon.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("admin"));

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const parseYear = (value) => {
  const year = Number.parseInt(value, 10);
  if (!Number.isFinite(year)) return null;
  if (year < 2000 || year > 2100) return null;
  return year;
};

const parseMonth = (value) => {
  const month = Number.parseInt(value, 10);
  if (!Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return month;
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

const safeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const requestedYear = parseYear(req.query.year);
    const requestedMonth = parseMonth(req.query.month);
    const year = requestedYear ?? now.getFullYear();
    const monthIndex = (requestedMonth ?? now.getMonth() + 1) - 1;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    const startOfMonth = new Date(year, monthIndex, 1);
    const endOfMonth = new Date(year, monthIndex + 1, 1);

    const todayStart = startOfDay(now);
    const tomorrowStart = endOfDay(now);
    const todayKey = todayStart.toISOString().slice(0, 10);

    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      activeAdmins,
      activeCoupons,
      expiringCoupons,
      bookingPending,
      bookingCompletedToday,
      bookingCancelledToday,
      newCustomers,
      monthlyRevenueAgg,
      currentMonthRevenueAgg,
      weeklyRevenueAgg,
      servicePopularityAgg,
      peakDayAgg,
      retentionAgg,
    ] = await Promise.all([
      User.countDocuments({ status: "active", role: "customer" }),
      User.countDocuments({ status: "active", role: "admin" }),
      Coupon.countDocuments({
        isActive: true,
        $and: [
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: null },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: null },
              { endDate: { $gte: now } },
            ],
          },
        ],
      }),
      Coupon.countDocuments({
        isActive: true,
        endDate: { $gte: now, $lte: sevenDaysOut },
      }),
      Booking.countDocuments({ status: { $in: ["pending", "confirmed", "in-progress"] } }),
      Booking.countDocuments({ status: "completed", "slot.date": todayKey }),
      Booking.countDocuments({ status: "cancelled", "slot.date": todayKey }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      }),
      Transaction.aggregate([
        {
          $match: {
            status: "paid",
            updatedAt: { $gte: startOfYear, $lt: endOfYear },
          },
        },
        {
          $project: {
            month: { $month: "$updatedAt" },
            gross: {
              $ifNull: ["$metadata.subtotal", "$grossAmount"],
            },
            discount: { $ifNull: ["$metadata.discountAmount", 0] },
            net: "$amount",
          },
        },
        {
          $group: {
            _id: "$month",
            gross: { $sum: "$gross" },
            discount: { $sum: "$discount" },
            net: { $sum: "$net" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "paid",
            updatedAt: { $gte: startOfMonth, $lt: endOfMonth },
          },
        },
        {
          $project: {
            gross: {
              $ifNull: ["$metadata.subtotal", "$grossAmount"],
            },
            discount: { $ifNull: ["$metadata.discountAmount", 0] },
            net: "$amount",
          },
        },
        {
          $group: {
            _id: null,
            gross: { $sum: "$gross" },
            discount: { $sum: "$discount" },
            net: { $sum: "$net" },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "paid",
            updatedAt: { $gte: startOfMonth, $lt: endOfMonth },
          },
        },
        {
          $project: {
            dayOfMonth: { $dayOfMonth: "$updatedAt" },
            gross: {
              $ifNull: ["$metadata.subtotal", "$grossAmount"],
            },
            discount: { $ifNull: ["$metadata.discountAmount", 0] },
            net: "$amount",
          },
        },
        {
          $addFields: {
            week: {
              $add: [
                {
                  $floor: {
                    $divide: [{ $subtract: ["$dayOfMonth", 1] }, 7],
                  },
                },
                1,
              ],
            },
          },
        },
        {
          $group: {
            _id: "$week",
            gross: { $sum: "$gross" },
            discount: { $sum: "$discount" },
            net: { $sum: "$net" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "paid",
            updatedAt: { $gte: startOfMonth, $lt: endOfMonth },
          },
        },
        { $unwind: "$bookedServices" },
        {
          $group: {
            _id: "$bookedServices.name",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: { $ne: "cancelled" },
            startTime: { $gte: startOfMonth, $lt: endOfMonth },
          },
        },
        {
          $project: {
            dayOfWeek: { $dayOfWeek: "$startTime" },
          },
        },
        {
          $group: {
            _id: "$dayOfWeek",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      Booking.aggregate([
        {
          $match: {
            startTime: {
              $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
              $lt: tomorrowStart,
            },
          },
        },
        {
          $group: {
            _id: "$user",
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            customers: { $sum: 1 },
            repeatCustomers: {
              $sum: {
                $cond: [{ $gte: ["$count", 2] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const monthlyRevenueData = Array.from({ length: 12 }).map((_, index) => {
      const monthNumber = index + 1;
      const entry = Array.isArray(monthlyRevenueAgg)
        ? monthlyRevenueAgg.find((row) => row._id === monthNumber)
        : null;

      const gross = safeNumber(entry?.gross);
      const discount = safeNumber(entry?.discount);
      const net = safeNumber(entry?.net);

      return {
        month: MONTH_LABELS[index],
        revenue: gross,
        discount,
        net,
      };
    });

    const currentMonthEntry = Array.isArray(currentMonthRevenueAgg)
      ? currentMonthRevenueAgg[0]
      : null;

    const grossMonth = safeNumber(currentMonthEntry?.gross);
    const discountMonth = safeNumber(currentMonthEntry?.discount);
    const netMonth = safeNumber(currentMonthEntry?.net);
    const monthTransactions = safeNumber(currentMonthEntry?.count);

    const discountRate = grossMonth > 0 ? discountMonth / grossMonth : 0;
    const avgPerBooking = monthTransactions > 0 ? netMonth / monthTransactions : 0;

    const weeklyRevenueData = (Array.isArray(weeklyRevenueAgg) ? weeklyRevenueAgg : []).map(
      (row) => ({
        week: `Week ${row._id}`,
        revenue: safeNumber(row.gross),
        discount: safeNumber(row.discount),
        net: safeNumber(row.net),
      })
    );

    const servicePopularity = (Array.isArray(servicePopularityAgg)
      ? servicePopularityAgg
      : []
    ).map((row) => ({
      name: row._id || "Service",
      count: safeNumber(row.count),
    }));

    const mostPopularService = servicePopularity[0]?.name ?? null;

    const dayNameMap = {
      1: "Sunday",
      2: "Monday",
      3: "Tuesday",
      4: "Wednesday",
      5: "Thursday",
      6: "Friday",
      7: "Saturday",
    };

    const peakDayIndex = Array.isArray(peakDayAgg) ? peakDayAgg[0]?._id : null;
    const peakDay = peakDayIndex ? dayNameMap[peakDayIndex] : null;

    const retentionEntry = Array.isArray(retentionAgg) ? retentionAgg[0] : null;
    const retentionCustomers = safeNumber(retentionEntry?.customers);
    const repeatCustomers = safeNumber(retentionEntry?.repeatCustomers);
    const retentionPercent =
      retentionCustomers > 0 ? (repeatCustomers / retentionCustomers) * 100 : 0;

    res.json({
      year,
      month: monthIndex + 1,
      stats: {
        activeUsers,
        activeCoupons,
        expiringCoupons,
        revenueMonthly: {
          gross: grossMonth,
          discount: discountMonth,
          net: netMonth,
          transactions: monthTransactions,
          discountRate,
          avgPerBooking,
        },
        quickStats: {
          pendingBookings: bookingPending,
          completedToday: bookingCompletedToday,
          newCustomers,
          cancelledToday: bookingCancelledToday,
        },
        insights: {
          mostPopularService,
          peakDay,
          activeAdmins,
          customerRetentionPercent: retentionPercent,
        },
        servicePopularity,
      },
      series: {
        monthlyRevenueData,
        weeklyRevenueData,
      },
    });
  } catch (error) {
    console.error("Failed to build dashboard metrics", error);
    res.status(500).json({ message: "Failed to build dashboard metrics" });
  }
});

export default router;
