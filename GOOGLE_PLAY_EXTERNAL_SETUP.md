# Google Play Billing & Cloud External Setup Guide
**Application:** Gym Management SaaS  
**Package Name:** `com.gymsaas.app`  
**Date:** November 14, 2026  
**Document Type:** Production External Setup Instructions  

---

## 1. Overview
This document contains the step-by-step instructions for configuring Google Cloud Platform and Google Play Console for the Gym Management SaaS application. All application source code across Backend (Node.js/Express), Frontend (React 19), and Android Native (Capacitor/Java) has been fully implemented, hardened, and verified locally.

Follow the instructions below to enable live Google Play purchases and real-time subscription lifecycle management.

---

## 2. Google Cloud Platform & Service Account Setup

### Step 2.1: Enable Google Play Developer API
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Google Cloud project (or create a new dedicated project, e.g., `gym-saas-production`).
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Play Android Developer API**.
5. Click **Enable**.

### Step 2.2: Create Service Account
1. Navigate to **IAM & Admin > Service Accounts**.
2. Click **Create Service Account**:
   - **Service account name:** `play-billing-service`
   - **Service account ID:** `play-billing-service`
   - **Description:** `Service account for Gym SaaS Google Play Billing receipt verification and RTDN`
3. Click **Create and Continue**.
4. (Optional) Role: You can assign `Pub/Sub Subscriber` or leave GCP project roles empty, as Play Store permissions are managed inside Google Play Console.
5. Click **Done**.

### Step 2.3: Generate JSON Private Key
1. In the Service Accounts list, click on the newly created service account (`play-billing-service@...`).
2. Go to the **Keys** tab.
3. Click **Add Key > Create new key**.
4. Select **JSON** format and click **Create**.
5. Save the downloaded JSON file securely (e.g., `google-service-account.json`).

### Step 2.4: Configure Backend Environment
On your production backend server (or in `backend/.env`):
Option A (Path to file):
```env
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=/absolute/path/to/google-service-account.json
```
Option B (Direct JSON content in environment variable):
```env
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN RSA PRIVATE KEY-----\n...","client_email":"..."}'
```

---

## 3. Google Play Console Linking & API Access

### Step 3.1: Link Cloud Project
1. Open the [Google Play Console](https://play.google.com/console).
2. From the left menu, select **API access** (under Developer account).
3. If not already linked, click **Link project** and select your Google Cloud project.

### Step 3.2: Grant Permissions to Service Account
1. In **API access**, locate your service account (`play-billing-service@...`).
2. Click **Manage Play Console permissions** (or **Invite user**).
3. Under the **Account permissions** tab, enable:
   - View financial data, orders, and cancellation survey responses
   - Manage orders and subscriptions
4. Under the **App permissions** tab, ensure your app (`com.gymsaas.app`) is selected.
5. Click **Save** or **Send invite**.

---

## 4. Google Cloud Pub/Sub & RTDN Setup

Google Real-Time Developer Notifications (RTDN) inform your server instantly when a user renews, cancels, pauses, or enters a grace period.

### Step 4.1: Create Pub/Sub Topic
1. In Google Cloud Console, navigate to **Pub/Sub > Topics**.
2. Click **Create Topic**:
   - **Topic ID:** `play-subs-notifications`
3. Leave encryption as Google-managed and click **Create**.

### Step 4.2: Grant Publisher Permission to Google Play
1. In the topic details for `play-subs-notifications`, click on the **Permissions** tab.
2. Click **Add Principal**:
   - **New principals:** `google-play-developer-notifications@system.gserviceaccount.com`
   - **Role:** `Pub/Sub Publisher`
3. Click **Save**.

### Step 4.3: Link Topic in Play Console
1. In Google Play Console, select your app (`com.gymsaas.app`).
2. Go to **Monetization setup** (under Monetize).
3. Under **Real-time developer notifications**, enter your full Pub/Sub topic name:
   ```text
   projects/<YOUR_GCP_PROJECT_ID>/topics/play-subs-notifications
   ```
4. Click **Send test notification** to verify connectivity.
5. Click **Save changes**.

### Step 4.4: Create Pub/Sub Push Subscription
1. In Google Cloud Console, go to **Pub/Sub > Subscriptions**.
2. Click **Create Subscription**:
   - **Subscription ID:** `play-subs-push-subscription`
   - **Select a Cloud Pub/Sub topic:** `play-subs-notifications`
   - **Delivery type:** **Push**
   - **Endpoint URL:**
     ```text
     https://api.gym-newss.kiaantechnology.com/api/purchases/google-play/webhook?token=YOUR_STRONG_RANDOM_SECRET
     ```
   - **Acknowledgement deadline:** `30 seconds`
   - **Retry policy:** `Retry after exponential backoff delay` (Minimum: 10s, Maximum: 600s)
3. Set in your `backend/.env`:
   ```env
   GOOGLE_PUBSUB_WEBHOOK_SECRET=YOUR_STRONG_RANDOM_SECRET
   ```
4. (Optional OIDC Mode): If you choose "Enable authentication" with Google Service Account OIDC tokens:
   - Set **Audience:** `https://api.gym-newss.kiaantechnology.com/api/purchases/google-play/webhook`
   - Set in `backend/.env`:
     ```env
     GOOGLE_PUBSUB_AUDIENCE=https://api.gym-newss.kiaantechnology.com/api/purchases/google-play/webhook
     GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL=<YOUR_PUBSUB_INVOKER_SERVICE_ACCOUNT>
     ```

---

## 5. Subscription Products & Base Plans Configuration

In Google Play Console, go to **Monetize > Products > Subscriptions**.  
Create the following **3 Subscription Products**, and under each product, add **3 Base Plans**:

### Product 1: Starter Tier
- **Product ID:** `gym_starter`
- **Name:** Gym SaaS Starter
- **Base Plans to add:**
  1. **Base Plan ID:** `monthly` | **Type:** Auto-renewing | **Duration:** 1 Month (`P1M`) | **Price:** ₹700 INR
  2. **Base Plan ID:** `quarterly` | **Type:** Auto-renewing | **Duration:** 3 Months (`P3M`) | **Price:** ₹1,995 INR (5% discount)
  3. **Base Plan ID:** `yearly` | **Type:** Auto-renewing | **Duration:** 1 Year (`P1Y`) | **Price:** ₹7,140 INR (15% discount)

### Product 2: Standard Tier
- **Product ID:** `gym_standard`
- **Name:** Gym SaaS Standard
- **Base Plans to add:**
  1. **Base Plan ID:** `monthly` | **Type:** Auto-renewing | **Duration:** 1 Month (`P1M`) | **Price:** ₹900 INR
  2. **Base Plan ID:** `quarterly` | **Type:** Auto-renewing | **Duration:** 3 Months (`P3M`) | **Price:** ₹2,565 INR (5% discount)
  3. **Base Plan ID:** `yearly` | **Type:** Auto-renewing | **Duration:** 1 Year (`P1Y`) | **Price:** ₹9,180 INR (15% discount)

### Product 3: Pro Tier
- **Product ID:** `gym_pro`
- **Name:** Gym SaaS Pro
- **Base Plans to add:**
  1. **Base Plan ID:** `monthly` | **Type:** Auto-renewing | **Duration:** 1 Month (`P1M`) | **Price:** ₹1,200 INR
  2. **Base Plan ID:** `quarterly` | **Type:** Auto-renewing | **Duration:** 3 Months (`P3M`) | **Price:** ₹3,420 INR (5% discount)
  3. **Base Plan ID:** `yearly` | **Type:** Auto-renewing | **Duration:** 1 Year (`P1Y`) | **Price:** ₹12,240 INR (15% discount)

> [!IMPORTANT]
> The Android app and backend strictly standardize on these 3 Product IDs (`gym_starter`, `gym_standard`, `gym_pro`) and their respective base plan IDs (`monthly`, `quarterly`, `yearly`). If any requested base plan cannot be matched, the native BillingClient rejects with `OFFER_NOT_FOUND` rather than silently substituting a different billing period.

---

## 6. License Testing Configuration

To perform test purchases without real credit card charges:

1. In Google Play Console, go to **Setup > License testing**.
2. Add your tester email addresses (e.g., `developer@gmail.com`, `tester@gmail.com`).
3. Under **License test response**, select **RESPOND_NORMALLY**.
4. In Google Play Store on your test Android device:
   - Ensure the primary Google Play account is one of the added tester emails.
   - When initiating a purchase, Google Play will display:
     `"Test Card, always approves"` or `"Test Card, always declines"`.
   - Test renewals will renew on accelerated test timelines (e.g., a monthly subscription renews every 5 minutes up to 6 times).

---

## 7. Account Deletion URL for Play Store Listing
Google Play requires apps with user accounts to provide an in-app and web-based account deletion URL.
- **In-App & Web URL:**  
  `https://gym-newss.kiaantechnology.com/delete-account`
- **Data Retention & Policy Statement:**  
  Detailed in [frontend/src/Pages/PublicDeleteAccount.jsx](file:///c:/Users/kiaan/Downloads/gym%20new/frontend/src/Pages/PublicDeleteAccount.jsx).
