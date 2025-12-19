import mongoose from "mongoose";

const GeneralSchema = new mongoose.Schema(
  {
    businessName: String,
    description: String,
    address: String,
    phone: String,
    email: String,
    social: {
      instagram: String,
      facebook: String,
      tiktok: String,
    },
    hours: [{ day: String, open: String, close: String }],
    statistics: {
      yearsExperience: Number,
      happyCustomers: Number,
    },
  },
  { _id: false }
);

const BookingSettingsSchema = new mongoose.Schema(
  {
    dpType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    dpAmount: { type: Number, default: 0 },
    leadTimeDays: { type: Number, default: 1 },
    cancellationPolicy: { type: String, default: "" },
    slotDurationMinutes: { type: Number, default: 30 },
  },
  { _id: false }
);

const PaymentSettingsSchema = new mongoose.Schema(
  {
    gateways: [
      {
        name: String,
        active: { type: Boolean, default: false },
        config: Object,
      },
    ],
    activeMethods: [{ type: String }],
  },
  { _id: false }
);

const NotificationSettingsSchema = new mongoose.Schema(
  {
    templates: {
      email: {
        reminder: String,
        confirmation: String,
      },
      whatsapp: {
        reminder: String,
        confirmation: String,
      },
    },
    reminderScheduleDays: { type: [Number], default: [7, 1] },
  },
  { _id: false }
);

const AppearanceSchema = new mongoose.Schema(
  {
    themeColor: String,
    logoUrl: String,
    faviconUrl: String,
    seo: {
      title: String,
      description: String,
      keywords: [{ type: String }],
    },
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    general: GeneralSchema,
    booking: BookingSettingsSchema,
    payment: PaymentSettingsSchema,
    notifications: NotificationSettingsSchema,
    appearance: AppearanceSchema,
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
