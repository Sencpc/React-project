# Flower Beauty Salon - Backend (Express + Mongoose)

This backend provides MongoDB data models and an Express server to support the salon app.

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **MongoDB** (Local installation, Docker, or MongoDB Atlas cloud)
- **Git** (to clone the repository)

## Quick Start (Clone and Run)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd React-project
```

### 2. Install Dependencies (Backend and Frontend)

**Option A: Install separately**

```bash
# Backend
cd Backend
npm install

# Frontend (in a new terminal)
cd Frontend
npm install
```

**Option B: Install from project root** (if npm scripts are configured)

```bash
npm run install:backend
npm run install:frontend
```

### 3. Set Up MongoDB

**Option A: Local MongoDB**

- Install and start MongoDB on your machine (e.g., `mongod` on Windows/Mac/Linux).
- MongoDB will be available at `mongodb://localhost:27017/flower_beauty_salon` by default.

**Option B: Docker**

```bash
cd Backend
docker compose -f docker-compose.yml up -d
```

**Option C: MongoDB Atlas (Cloud)**

- Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- Get your connection string and use it in `.env`

### 4. Configure Environment Variables

Create `Backend/.env` with the required values below. Copy the template and fill in your actual keys:

```dotenv
# Database
MONGODB_URI=mongodb://localhost:27017/flower_beauty_salon

# JWT & CORS
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:5173

# Server
PORT=4000

# Midtrans (Payment)
MIDTRANS_MERCHANT_ID=your_midtrans_merchant_id
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Twilio (WhatsApp & SMS - optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SERVICE_SID=your_twilio_service_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number
WHATSAPP_TEST_MODE=true

# Booking Reminders
BOOKING_REMINDER_CRON=0 9 * * *
BOOKING_REMINDER_TZ=Asia/Jakarta

# App URL (for payment callbacks)
APP_BASE_URL=http://localhost:5173
```

Get your **Midtrans keys**:

- Go to https://dashboard.midtrans.com
- Use **Sandbox** keys for testing (keys starting with `SB-`)
- Switch to **Production** keys when live (keys starting with `Mid-`)

### 5. Seed Initial Data (Optional but Recommended)

```bash
cd Backend
npm run seed
```

This creates sample users, services, and coupon codes for testing.

### 6. Start the Backend

```bash
cd Backend
npm run dev
```

Backend will be running at **http://localhost:4000** ✓

### 7. Start the Frontend (in a new terminal)

Create `Frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:4000
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

Then run:

```bash
cd Frontend
npm run dev
```

Frontend will be running at **http://localhost:5173** ✓

### 8. Access the Application

Open your browser and go to:

- **App**: http://localhost:5173
- **Backend Health**: http://localhost:4000/health

## Login Credentials (After Seeding)

**Admin**

- Email: `admin@example.com`
- Password: `Admin@123`

**Customer**

- Email: `andi@example.com`
- Password: `Customer@123`

## Setup

### Midtrans Snap Payments

Configure the following variables in `Backend/.env` to enable Midtrans Snap token generation for customer checkout:

- `MIDTRANS_SERVER_KEY` – required server key from the Midtrans dashboard.
- `MIDTRANS_CLIENT_KEY` – client key used by the frontend Snap script.
- `MIDTRANS_IS_PRODUCTION` – set to `true` in production to hit the live Snap endpoint (defaults to sandbox).
- `APP_BASE_URL` (or `FRONTEND_BASE_URL`) – the public URL of your web app (e.g. `https://app.yoursalon.com`). Used to send Midtrans finish/pending/error callbacks back to your site instead of the default `example.com` values.
- Configure Midtrans HTTP Notification to POST to `/api/transactions/midtrans-notify` on your public backend URL. The server verifies the Midtrans signature and updates the booking/transaction status.

New customer-facing routes:

- `POST /api/customer/cart/redeem-coupon` – validate a coupon code against the current cart and return the discount.
- `POST /api/customer/checkout/snap-token` – builds a Midtrans Snap transaction token for the current cart (after applying any coupon).

The `/checkout/snap-token` route requires a populated cart and returns both the Snap token and `redirectUrl` so the frontend can either open `window.snap.pay` or fall back to the hosted payment page.

#### Testing with Alfamart (Sandbox)

To test Alfamart payment in sandbox mode:

1. In the frontend, add items to cart and click **Bayar dengan Midtrans**.
2. In the Snap modal, select **Alfamart** as the payment method.
3. Copy the displayed payment code.
4. Open https://simulator.sandbox.midtrans.com/alfamart/payment in a new tab.
5. Paste the payment code and click **Pay**.
6. Return to the app and check `/customer/history` to see the booking status update to **Paid** (Midtrans sends a notification to `/api/transactions/midtrans-notify`).

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
