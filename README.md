# 🏛️ QNOX GYM — Complete Production Luxury Gym Platform

> **QNOX GYM** is an ultra-luxury architectural fitness sanctuary management platform inspired by **[Third Space London](https://www.thirdspace.london/)**. Built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) featuring pure black backgrounds, warm champagne gold accents, **separated component CSS files**, Razorpay payments, Nodemailer luxury email dispatches, atomic class reservations, and an Executive Admin Command Suite.

---

## 💎 Features Implemented

### 1. Executive Admin Dashboard (`/admin`)
- **Executive Overview**: Total Members, Active Memberships, Total Revenue, Total Bookings, Pending Tour Inquiries.
- **Revenue Analytics**: Interactive weekly and monthly trajectory charts with date filtering.
- **Member Dossier Management**: Search, pagination, filter by membership status (`Active`, `Expired`, `None`), assign/extend residency, delete dossier.
- **Residency Tiers Management**: Full CRUD for plans, monthly/quarterly/half-yearly/yearly pricing, benefits management, and instant activation toggle.
- **Daily Masterclass Booking Control**: View all reservations across sanctuaries, mark attendance (`Attended`, `No-Show`), cancel and auto-release seats.
- **Master Coaches & Practitioners**: Add, edit, delete trainer profiles with specialties, photo preview, and ratings.
- **Sanctuary Portfolio Locations**: Add new club sanctuaries, operational status (`OPEN`, `COMING SOON`, `PRIVATE ACCESS ONLY`), maps link, and gallery.
- **Financial Audit Trail**: All Razorpay transactions, printable tax invoice receipts, and refund execution.
- **The Inner Circle Newsletter**: View subscriber emails, export to CSV (`qnox-inner-circle-subscribers.csv`), and dispatch rich HTML editorial campaigns.
- **Tour Inquiries**: Real-time walkthrough requests from prospective members.

### 2. Authentication & Authorization (RBAC)
- **JWT-Based Authentication**: Secure stateless token issuance with expiration handling.
- **Password Hashing**: Cryptographic salt rounds via `bcryptjs`.
- **Role-Based Access Control**:
  - `Super Admin` & `Admin`: Full command suite access.
  - `Trainer`: Attendance marking & schedule viewing.
  - `Gym Member`: Personal portal, class booking & invoice download.
- **Password Recovery**: Secure 30-minute SHA-256 tokens with luxury reset emails.
- **Pre-Seeded Super Admin**:
  - **Email**: `admin@qnoxgym.com`
  - **Password**: `Admin@QNOX2026!`

### 3. Membership & Razorpay Payments
- **Multi-Term Pricing**: 1 Month, 3 Months (Quarterly), 6 Months (Half-Yearly), 12 Months (Annual).
- **Backend Signature Verification**: Cryptographic HMAC-SHA256 signature verification ensuring payment tampering is impossible.
- **Automated Membership Activation**: Automatic calculation of `startDate` and `endDate` upon verified payment.
- **Printable Tax Invoices**: Itemized tax invoice with 18% GST breakdown, unique invoice numbers (`INV-2026-XXXXXX`), and `window.print()` styling.

### 4. Atomic Class Booking & Anti-Overbooking
- **Atomic MongoDB Updates**: Prevents concurrent race conditions when booking the last available seat.
- **Duplicate Prevention**: Prevents members from holding multiple concurrent bookings for the same class on the same date.
- **Instant Seat Release**: Cancelling automatically releases the slot back to the waitlist (`$inc: { bookedSpots: -1 }`).
- **Unique Reservation ID**: Every booking generates an official concierge pass code (e.g. `QNX-882941`).

### 5. Luxury Email Dispatch (Nodemailer)
- Branded high-contrast dark HTML templates matching QNOX GYM's aesthetic.
- Automated triggers:
  - New member welcome & ID dispatch.
  - Booking confirmation & cancellation dispatches.
  - Razorpay payment tax receipt & invoice.
  - Cryptographic password reset links.
  - VIP walkthrough request confirmations.
  - Inner Circle newsletter campaign dispatches.
- **Non-blocking error handling**: Email network delays or failures never crash or block database transactions.

### 6. Separated CSS Architecture
Every component has its own dedicated `.css` file imported directly within that component:
- `Navbar.jsx` ➔ `Navbar.css`
- `Hero.jsx` ➔ `Hero.css`
- `ClubsSection.jsx` ➔ `ClubsSection.css`
- `DisciplinesSection.jsx` ➔ `DisciplinesSection.css`
- `MembershipTiers.jsx` ➔ `MembershipTiers.css`
- `ScheduleSection.jsx` ➔ `ScheduleSection.css`
- `MasterTrainers.jsx` ➔ `MasterTrainers.css`
- `EditorialQuotes.jsx` ➔ `EditorialQuotes.css`
- `TourModal.jsx` ➔ `TourModal.css`
- `Footer.jsx` ➔ `Footer.css`
- `AuthModal.jsx` ➔ `AuthModal.css`
- `PaymentCheckoutModal.jsx` ➔ `PaymentCheckoutModal.css`
- `ReceiptModal.jsx` ➔ `ReceiptModal.css`
- `MemberPortalModal.jsx` ➔ `MemberPortalModal.css`
- `AdminDashboard.jsx` ➔ `AdminDashboard.css`
- `Toast.jsx` ➔ `Toast.css`

---

## 📁 Complete Project Architecture (MVC)

```
NoxGym/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & memory fallback
│   │   ├── controllers/              # MVC Controllers
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── bookingController.js
│   │   │   ├── clubController.js
│   │   │   ├── inquiryController.js
│   │   │   ├── membershipPlanController.js
│   │   │   ├── newsletterController.js
│   │   │   ├── paymentController.js
│   │   │   ├── trainerController.js
│   │   │   └── uploadController.js
│   │   ├── models/                   # Mongoose Database Schemas
│   │   │   ├── Booking.js
│   │   │   ├── ClassSchedule.js
│   │   │   ├── Club.js
│   │   │   ├── MembershipInquiry.js
│   │   │   ├── MembershipPlan.js
│   │   │   ├── Newsletter.js
│   │   │   ├── NewsletterCampaign.js
│   │   │   ├── Payment.js
│   │   │   ├── Trainer.js
│   │   │   └── User.js
│   │   ├── routes/                   # API Endpoints
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── clubRoutes.js
│   │   │   ├── inquiryRoutes.js
│   │   │   ├── membershipPlanRoutes.js
│   │   │   ├── newsletterRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── trainerRoutes.js
│   │   │   └── uploadRoutes.js
│   │   ├── middlewares/
│   │   │   ├── auth.js               # JWT verification & RBAC authorization
│   │   │   ├── errorHandler.js       # Centralized error handler
│   │   │   ├── rateLimiter.js        # Express rate limiting
│   │   │   └── upload.js             # Multer image storage & type filter
│   │   ├── services/
│   │   │   ├── emailService.js       # Nodemailer luxury HTML templates
│   │   │   └── paymentService.js     # Razorpay order & HMAC SHA-256 verification
│   │   ├── seed/
│   │   │   └── seedData.js           # Preloads Admin, Clubs, Plans, Trainers, Classes
│   │   └── app.js                    # Helmet, CORS, Rate Limit & Route mounting
│   ├── tests/
│   │   └── api.test.js               # Automated production test suite
│   ├── public/uploads/               # Static image upload directory
│   ├── server.js                     # Backend entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/               # Modular UI Components + Dedicated CSS
│   │   │   ├── AdminDashboard.jsx & AdminDashboard.css
│   │   │   ├── AuthModal.jsx & AuthModal.css
│   │   │   ├── ClubsSection.jsx & ClubsSection.css
│   │   │   ├── DisciplinesSection.jsx & DisciplinesSection.css
│   │   │   ├── EditorialQuotes.jsx & EditorialQuotes.css
│   │   │   ├── Footer.jsx & Footer.css
│   │   │   ├── Hero.jsx & Hero.css
│   │   │   ├── MasterTrainers.jsx & MasterTrainers.css
│   │   │   ├── MemberPortalModal.jsx & MemberPortalModal.css
│   │   │   ├── MembershipTiers.jsx & MembershipTiers.css
│   │   │   ├── Navbar.jsx & Navbar.css
│   │   │   ├── PaymentCheckoutModal.jsx & PaymentCheckoutModal.css
│   │   │   ├── ReceiptModal.jsx & ReceiptModal.css
│   │   │   ├── ScheduleSection.jsx & ScheduleSection.css
│   │   │   ├── Toast.jsx & Toast.css
│   │   │   └── TourModal.jsx & TourModal.css
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js                # Fullstack API client with JWT storage
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── package.json                      # Monorepo runner scripts
```

---

## 🚀 Running the Project

### 1. Run Automated Backend Tests
```bash
cd backend
npm test
```
Result: **12/12 Automated Production Integrity Tests Passed.**

### 2. Start the Backend API
```bash
cd backend
npm start
```
Starts at **`http://localhost:5000`**

### 3. Start the Frontend Client
```bash
cd frontend
npm run dev
```
Starts at **`http://localhost:3000`**

---

## 🔑 Default Super Admin Credentials

- **Email**: `admin@qnoxgym.com`
- **Password**: `Admin@QNOX2026!`
- **Access**: Click **SIGN IN** on the top navigation bar, then click the **"FILL SUPER ADMIN LOGIN"** button to auto-fill credentials, and enter the **ADMIN SUITE**.
