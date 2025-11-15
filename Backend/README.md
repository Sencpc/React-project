# Flower Beauty Salon - Backend (Express + Mongoose)

This backend provides MongoDB data models and an Express server to support the salon app.

## Prerequisites

- Node.js 18+
- MongoDB local (or Docker) or MongoDB Atlas

## Setup

1. Configure environment variables:
   - Create `Backend/.env` and set required values (see below).
2. Install dependencies:
   - From the `Backend` folder run `npm install` (or from project root use `npm run install:backend`).
3. Run MongoDB:
   - Local MongoDB, or with Docker: `docker compose -f Backend/docker-compose.yml up -d`.
4. Seed initial data (optional):
   - `npm run seed`
5. Start dev server:
   - `npm run dev`

Server defaults to http://localhost:4000 and exposes `/health`.

### Midtrans Snap Payments

Configure the following variables in `Backend/.env` to enable Midtrans Snap token generation for customer checkout:

- `MIDTRANS_SERVER_KEY` – required server key from the Midtrans dashboard.
- `MIDTRANS_CLIENT_KEY` – client key used by the frontend Snap script.
- `MIDTRANS_IS_PRODUCTION` – set to `true` in production to hit the live Snap endpoint (defaults to sandbox).

New customer-facing routes:

- `POST /api/customer/cart/redeem-coupon` – validate a coupon code against the current cart and return the discount.
- `POST /api/customer/checkout/snap-token` – builds a Midtrans Snap transaction token for the current cart (after applying any coupon).

The `/checkout/snap-token` route requires a populated cart and returns both the Snap token and `redirectUrl` so the frontend can either open `window.snap.pay` or fall back to the hosted payment page.

## WhatsApp Booking Reminders

Automated WhatsApp reminders are sent 3 days before a confirmed booking.

Configure the following environment variables in your `Backend/.env` file to enable the integration:

- `TWILIO_ACCOUNT_SID` – Twilio account SID with WhatsApp access.
- `TWILIO_AUTH_TOKEN` – Twilio auth token.
- `TWILIO_WHATSAPP_FROM` – WhatsApp-enabled Twilio number (e.g. `whatsapp:+14155238886`).
- `WHATSAPP_TEST_MODE` – Set to `true` to log messages locally without calling Twilio.
- `BOOKING_REMINDER_CRON` – (Optional) Cron expression for the daily reminder job. Defaults to `0 9 * * *` (09:00 daily).
- `BOOKING_REMINDER_TZ` – (Optional) Timezone identifier for the cron job. Defaults to `Asia/Jakarta`.

After the server boots and connects to MongoDB it schedules the reminder job and immediately scans for bookings occurring exactly three days ahead. Bookings without a WhatsApp-capable number are skipped and logged for follow-up.

## SMS Verification (Twilio Verify)

The API exposes endpoints for triggering and confirming SMS one-time passwords via Twilio Verify.

1. Configure credentials in `.env`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - Optional: `TWILIO_VERIFY_FRIENDLY_NAME` (defaults to `Flower Beauty Salon Authentication`).
2. (Optional) Prime the Verify Service:
   - `npm run twilio:verify:create`
   - The script returns the Verify Service SID that will be reused automatically.
3. Available routes:
   - `POST /api/verify/service` (admin/setup use) – ensures the Verify service exists and returns its SID.
   - `POST /api/verify/send` – body `{ phone, locale? }`; starts an SMS verification (returns the Verify Service SID used).
   - `POST /api/verify/check` – body `{ phone, code }`; checks a verification attempt (returns the Verify Service SID used).

All phone numbers are normalised to E.164 format before calling Twilio. The service automatically reuses (or creates) a Verify Service named `Flower Beauty Salon Authentication`, so you do not need to store the service SID manually.

## Models

Implemented with Mongoose:

- User, Staff, Category, Service, Booking, Transaction, Review, BlogPost, GalleryItem, Coupon, Settings, Notification

You can add routes/controllers as needed. This project focuses on data modeling per the provided requirements.
