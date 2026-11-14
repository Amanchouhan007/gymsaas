/**
 * Google Play Billing Utility
 * Provides seamless bridge to playBillingService
 */
import {
  isAndroidNativeApp,
  isBillingReady,
  resolvePlayBillingSku,
  fetchGooglePlayProducts,
  initiateGooglePlaySubscription,
  restoreGooglePlayPurchases,
  queryNativeProductDetails,
  syncActivePurchasesOnResume
} from "../services/playBillingService";

export {
  isAndroidNativeApp,
  isBillingReady,
  resolvePlayBillingSku,
  fetchGooglePlayProducts,
  initiateGooglePlaySubscription,
  restoreGooglePlayPurchases,
  queryNativeProductDetails,
  syncActivePurchasesOnResume
};
