# gymsaas

Multi-tenant Gym Management SaaS Application with Google Play Billing and Razorpay payment integration.

## Architecture
- **Frontend:** React 19, Vite, Tailwind/Bootstrap, Capacitor
- **Mobile:** Android Native (Capacitor Bridge) with Google Play BillingClient 7.1.1
- **Backend:** Node.js, Express, MySQL, Prisma
- **Billing:** Dual payment routing (Google Play In-App Billing on Android Native, Razorpay on Web)

## Features
- Multi-tenant Gym & Branch Management
- Member Attendance & QR Check-in
- Diet & Workout Scheduling
- Real-Time Developer Notifications (RTDN via Cloud Pub/Sub)
- Google Play Compliance (Isolated in-app billing, active subscription cancellation warnings, account deletion flows)
