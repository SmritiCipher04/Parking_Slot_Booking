# ExcuseME - Full-Stack Parking Slot Booking System

A full-stack web application for reserving parking slots with secure online payment integration via Razorpay.

## 🚀 Features

- **Slot Availability**: Real-time interactive slot selection grid.
- **Secure Payment Gateway**: Integrates Razorpay API for processing payment transactions.
- **API Key Security**: Sensitive credentials (`RAZORPAY_KEY_SECRET`, `RAZORPAY_KEY_ID`) are stored strictly inside `.env` on the server and are hidden from client-side code.
- **Payment Verification**: Server-side HMAC SHA-256 signature verification ensures payment authenticity.
- **Offline Simulator Fallback**: Built-in payment simulator mode for offline/test mode operations.
- **Booking History & Auth**: Track user bookings and authentication endpoints.

---

## 📁 Directory & File Structure

```
Parking_Slot_Booking/
├── .env                       # Server environment variables & secret API keys
├── .env.example               # Template environment configuration file
├── .gitignore                 # Prevents committing sensitive files & node_modules
├── package.json               # Root scripts for starting the project
├── README.md                  # Project documentation & instructions
│
├── Backend/                   # Node.js & Express REST API Server
│   ├── .env                   # Backend environment configuration
│   ├── .env.example           # Backend environment template
│   ├── package.json           # Backend dependencies (express, razorpay, dotenv, cors)
│   ├── server.js              # Main Express server entry point
│   ├── config/
│   │   └── db.js              # Database/Data store connection initializer
│   ├── controllers/
│   │   ├── authController.js   # User registration & login handlers
│   │   ├── bookingController.js# User booking history & details
│   │   ├── paymentController.js# Razorpay order generation & HMAC signature verification
│   │   └── slotController.js   # Slot availability handlers
│   ├── middleware/
│   │   └── errorHandler.js    # Central error handler
│   ├── models/
│   │   └── dataStore.js       # Data model store (Facilities, Slots, Bookings, Users)
│   └── routes/
│       ├── authRoutes.js      # Endpoint: /api/auth
│       ├── bookingRoutes.js   # Endpoint: /api/bookings
│       ├── paymentRoutes.js   # Endpoint: /api/payment
│       └── slotRoutes.js      # Endpoint: /api/slots
│
└── Frontend/                  # User Interface Web Application
    ├── index.html             # Landing & location search
    ├── slots.html             # Slot layout & selection grid
    ├── payment.html           # Booking summary & Razorpay payment interface
    ├── confirmation.html      # Booking success confirmation
    ├── history.html           # User booking history table
    ├── login.html             # User login portal
    ├── register.html          # User registration portal
    ├── admin-login.html       # Administrator login
    ├── admin-dashboard.html   # Admin slot management dashboard
    ├── style.css              # Consolidated stylesheet
    └── js/
        ├── config.js          # API base URL configuration
        ├── payment.js         # Razorpay checkout & backend order creation
        ├── slots.js           # Interactive slot grid script
        ├── auth.js            # Authentication handlers
        └── history.js         # Booking history display script
```

---

## ⚙️ Environment Variables Setup (.env)

The sensitive Razorpay API secret key is stored in the `.env` file on the backend server:

```env
PORT=5000
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_TAyTdm1bjJolB1
RAZORPAY_KEY_SECRET=rzp_secret_TAyTdm1bjJolB1_SecretKey
```

> **Security Note**: Never commit `.env` to git repository. All `.env` files are ignored in `.gitignore`.

---

## 🛠️ How to Run the Project

### 1. Install Backend Dependencies
Open your terminal in the project directory and run:
```bash
npm run install-backend
```
*or navigate to `Backend/` and run `npm install`.*

### 2. Start the Backend Server
```bash
npm start
```
The server will start on `http://localhost:5000`.

### 3. Open the Frontend Application
- Access the web interface at `http://localhost:5000` (served directly by Express), or open `Frontend/index.html` in your web browser.

---

## 💳 Payment Integration Flow

1. User selects a parking slot and proceeds to `payment.html`.
2. Frontend sends an API request to `POST /api/payment/create-order` with the slot and amount details.
3. Backend fetches `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` from `.env` and creates a Razorpay Order ID.
4. Razorpay checkout modal opens with the generated `order_id` and public `key_id`.
5. Upon completion, frontend posts `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to `POST /api/payment/verify-payment`.
6. Backend computes the HMAC SHA-256 signature using `RAZORPAY_KEY_SECRET` to verify payment integrity and confirm slot booking.

---

## ✒️ Author
**Smriti Sarkar** | ADTU/1/2024-28/BCSS/158
