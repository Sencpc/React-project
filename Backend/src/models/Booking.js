import mongoose from "mongoose";

const BookedServiceSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    name: String, // denormalized
    price: Number, // captured at booking time
    durationMinutes: Number,
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    services: { type: [BookedServiceSchema], validate: (v) => v.length > 0 },
    stylist: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    notes: String,
    adminNotes: String,
    slot: {
      date: { type: String }, // yyyy-mm-dd for quick queries
    },
    reminders: {
      threeDay: {
        sentAt: { type: Date },
        messageSid: { type: String },
      },
    },
    payment: {
      method: {
        type: String,
        enum: [
          "cash",
          "bank-transfer",
          "e-wallet",
          "credit-card",
          "midtrans",
          "payment-link",
          "virtual-account",
        ],
        default: "e-wallet",
      },
      dpAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["unpaid", "pending", "paid", "refunded"],
        default: "unpaid",
      },
      invoiceNo: { type: String },
      reference: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
