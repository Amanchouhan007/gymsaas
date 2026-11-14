package com.gymsaas.app;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "GooglePlayBilling")
public class GooglePlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "GooglePlayBilling";
    private BillingClient billingClient;
    private PluginCall activePurchaseCall;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private synchronized void initBillingClient() {
        if (getContext() == null) return;
        PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .enablePrepaidPlans()
                .build();

        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(pendingPurchasesParams)
                .build();
    }

    private synchronized void connectToBillingClient(@Nullable final Runnable onConnected, @Nullable final Runnable onFailed) {
        if (billingClient == null) {
            initBillingClient();
        }

        if (billingClient != null && billingClient.isReady()) {
            if (onConnected != null) onConnected.run();
            return;
        }

        if (billingClient == null) {
            if (onFailed != null) onFailed.run();
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.i(TAG, "BillingClient connected successfully.");
                    if (onConnected != null) onConnected.run();
                } else {
                    Log.e(TAG, "BillingClient connection error: " + billingResult.getDebugMessage());
                    if (onFailed != null) onFailed.run();
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected.");
            }
        });
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        connectToBillingClient(
                () -> {
                    JSObject res = new JSObject();
                    res.put("ready", true);
                    call.resolve(res);
                },
                () -> {
                    JSObject res = new JSObject();
                    res.put("ready", false);
                    call.resolve(res);
                }
        );
    }

    @PluginMethod
    public void queryProductDetails(PluginCall call) {
        JSArray productIdsArray = call.getArray("productIds");
        String singleProductId = call.getString("productId");
        final String productTypeStr = call.getString("productType", "SUBS");

        List<String> productIds = new ArrayList<>();
        if (productIdsArray != null) {
            try {
                for (int i = 0; i < productIdsArray.length(); i++) {
                    productIds.add(productIdsArray.getString(i));
                }
            } catch (JSONException e) {
                call.reject("Invalid productIds array format.");
                return;
            }
        } else if (singleProductId != null && !singleProductId.isEmpty()) {
            productIds.add(singleProductId);
        } else {
            call.reject("Either productIds (array) or productId (string) is required.");
            return;
        }

        final String productType = "INAPP".equalsIgnoreCase(productTypeStr)
                ? BillingClient.ProductType.INAPP
                : BillingClient.ProductType.SUBS;

        connectToBillingClient(
                () -> executeQueryProductDetails(productIds, productType, call),
                () -> call.reject("Google Play Billing client not connected.")
        );
    }

    private void executeQueryProductDetails(List<String> productIds, String productType, PluginCall call) {
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (String pid : productIds) {
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(pid)
                            .setProductType(productType)
                            .build()
            );
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Failed to query product details: " + billingResult.getDebugMessage());
                return;
            }

            JSArray resultList = new JSArray();
            for (ProductDetails pd : productDetailsList) {
                JSObject pObj = new JSObject();
                pObj.put("productId", pd.getProductId());
                pObj.put("title", pd.getTitle());
                pObj.put("description", pd.getDescription());
                pObj.put("productType", pd.getProductType());

                if (pd.getProductType().equals(BillingClient.ProductType.SUBS)) {
                    List<ProductDetails.SubscriptionOfferDetails> offers = pd.getSubscriptionOfferDetails();
                    JSArray offersArr = new JSArray();
                    if (offers != null) {
                        for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                            JSObject oObj = new JSObject();
                            oObj.put("offerToken", offer.getOfferToken());
                            oObj.put("basePlanId", offer.getBasePlanId());
                            oObj.put("offerId", offer.getOfferId());

                            JSArray phasesArr = new JSArray();
                            if (offer.getPricingPhases() != null && offer.getPricingPhases().getPricingPhaseList() != null) {
                                for (ProductDetails.PricingPhase phase : offer.getPricingPhases().getPricingPhaseList()) {
                                    JSObject phObj = new JSObject();
                                    phObj.put("formattedPrice", phase.getFormattedPrice());
                                    phObj.put("priceAmountMicros", phase.getPriceAmountMicros());
                                    phObj.put("priceCurrencyCode", phase.getPriceCurrencyCode());
                                    phObj.put("billingPeriod", phase.getBillingPeriod());
                                    phObj.put("recurrenceMode", phase.getRecurrenceMode());
                                    phasesArr.put(phObj);
                                }
                            }
                            oObj.put("pricingPhases", phasesArr);
                            offersArr.put(oObj);
                        }
                    }
                    pObj.put("subscriptionOffers", offersArr);
                } else if (pd.getOneTimePurchaseOfferDetails() != null) {
                    ProductDetails.OneTimePurchaseOfferDetails otp = pd.getOneTimePurchaseOfferDetails();
                    pObj.put("formattedPrice", otp.getFormattedPrice());
                    pObj.put("priceAmountMicros", otp.getPriceAmountMicros());
                    pObj.put("priceCurrencyCode", otp.getPriceCurrencyCode());
                }

                resultList.put(pObj);
            }

            JSObject response = new JSObject();
            response.put("products", resultList);
            call.resolve(response);
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        final String productId = call.getString("productId");
        final String basePlanId = call.getString("basePlanId");
        final String offerToken = call.getString("offerToken");

        if (productId == null || productId.isEmpty()) {
            call.reject("Product ID is required.");
            return;
        }

        this.activePurchaseCall = call;

        connectToBillingClient(
                () -> queryAndLaunchBillingFlow(productId, basePlanId, offerToken, call),
                () -> call.reject("Google Play Billing client not connected.")
        );
    }

    private void queryAndLaunchBillingFlow(String productId, String basePlanId, String offerToken, PluginCall call) {
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(
                QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
        );

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && !productDetailsList.isEmpty()) {
                launchBillingWithDetails(productDetailsList.get(0), basePlanId, offerToken, call);
                return;
            }

            queryInAppFallback(productId, call);
        });
    }

    private void queryInAppFallback(String productId, PluginCall call) {
        List<QueryProductDetailsParams.Product> inAppList = new ArrayList<>();
        inAppList.add(
                QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
        );

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(inAppList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || productDetailsList.isEmpty()) {
                call.reject("PRODUCT_NOT_FOUND", "Product not found in Google Play: " + productId);
                return;
            }

            launchBillingWithDetails(productDetailsList.get(0), null, null, call);
        });
    }

    private void launchBillingWithDetails(ProductDetails productDetails, String targetBasePlanId, String targetOfferToken, PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("ACTIVITY_UNAVAILABLE", "Activity context not available to launch billing flow.");
            return;
        }

        BillingFlowParams.Builder flowBuilder = BillingFlowParams.newBuilder();

        if (productDetails.getProductType().equals(BillingClient.ProductType.SUBS)) {
            List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
            if (offers == null || offers.isEmpty()) {
                call.reject("NO_OFFERS_FOUND", "No subscription offers found for " + productDetails.getProductId());
                return;
            }

            String selectedOfferToken = null;
            if (targetOfferToken != null && !targetOfferToken.isEmpty()) {
                selectedOfferToken = targetOfferToken;
            } else if (targetBasePlanId != null && !targetBasePlanId.isEmpty()) {
                String normalizedTarget = targetBasePlanId.trim().toLowerCase();
                for (ProductDetails.SubscriptionOfferDetails o : offers) {
                    String baseId = o.getBasePlanId() != null ? o.getBasePlanId().trim().toLowerCase() : "";
                    if (baseId.equals(normalizedTarget) || baseId.contains(normalizedTarget) || normalizedTarget.contains(baseId)) {
                        selectedOfferToken = o.getOfferToken();
                        break;
                    }
                }
            }

            // Strict Validation: Never silently fall back to an arbitrary offer when the requested base plan is not matched
            if (selectedOfferToken == null) {
                call.reject("OFFER_NOT_FOUND", "No subscription offer found in Google Play matching base plan: " + (targetBasePlanId != null ? targetBasePlanId : "default"));
                return;
            }

            BillingFlowParams.ProductDetailsParams pDetailsParams =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(productDetails)
                            .setOfferToken(selectedOfferToken)
                            .build();
            flowBuilder.setProductDetailsParamsList(Collections.singletonList(pDetailsParams));
        } else {
            BillingFlowParams.ProductDetailsParams pDetailsParams =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(productDetails)
                            .build();
            flowBuilder.setProductDetailsParamsList(Collections.singletonList(pDetailsParams));
        }

        BillingResult result = billingClient.launchBillingFlow(activity, flowBuilder.build());
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            call.reject("Billing flow launch failed: " + result.getDebugMessage());
        }
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        connectToBillingClient(
                () -> {
                    QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build();

                    billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
                        if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                            call.reject("Failed to restore purchases: " + billingResult.getDebugMessage());
                            return;
                        }

                        JSArray purchasesArray = new JSArray();
                        for (Purchase p : purchases) {
                            JSObject pObj = new JSObject();
                            pObj.put("orderId", p.getOrderId());
                            pObj.put("purchaseToken", p.getPurchaseToken());
                            pObj.put("purchaseTime", p.getPurchaseTime());
                            pObj.put("purchaseState", p.getPurchaseState() == Purchase.PurchaseState.PENDING ? "PENDING" : "PURCHASED");
                            pObj.put("acknowledged", p.isAcknowledged());
                            pObj.put("packageName", p.getPackageName());

                            List<String> prods = p.getProducts();
                            if (prods != null && !prods.isEmpty()) {
                                pObj.put("productId", prods.get(0));
                            }
                            purchasesArray.put(pObj);
                        }

                        JSObject result = new JSObject();
                        result.put("purchases", purchasesArray);
                        call.resolve(result);
                    });
                },
                () -> call.reject("Google Play Billing client not connected.")
        );
    }

    @PluginMethod
    public void acknowledgePurchase(PluginCall call) {
        final String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.isEmpty()) {
            call.reject("purchaseToken is required.");
            return;
        }

        connectToBillingClient(
                () -> {
                    AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchaseToken)
                            .build();

                    billingClient.acknowledgePurchase(params, billingResult -> {
                        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            JSObject res = new JSObject();
                            res.put("acknowledged", true);
                            call.resolve(res);
                        } else {
                            call.reject("Failed to acknowledge purchase: " + billingResult.getDebugMessage());
                        }
                    });
                },
                () -> call.reject("Google Play Billing client not connected.")
        );
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (activePurchaseCall == null) return;

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) {
            Purchase purchase = purchases.get(0);
            JSObject res = new JSObject();
            res.put("purchaseToken", purchase.getPurchaseToken());
            res.put("orderId", purchase.getOrderId());
            res.put("packageName", purchase.getPackageName());
            res.put("purchaseState", purchase.getPurchaseState() == Purchase.PurchaseState.PENDING ? "PENDING" : "PURCHASED");
            res.put("purchaseTime", purchase.getPurchaseTime());
            res.put("acknowledged", purchase.isAcknowledged());

            List<String> products = purchase.getProducts();
            if (products != null && !products.isEmpty()) {
                res.put("productId", products.get(0));
            }

            activePurchaseCall.resolve(res);
            activePurchaseCall = null;
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            activePurchaseCall.reject("USER_CANCELED", "Purchase flow was cancelled by user.");
            activePurchaseCall = null;
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            activePurchaseCall.reject("ITEM_ALREADY_OWNED", "Subscription is already owned. Please restore purchases.");
            activePurchaseCall = null;
        } else {
            activePurchaseCall.reject("PURCHASE_FAILED", "Google Play purchase failed with code: " + billingResult.getResponseCode() + " debug: " + billingResult.getDebugMessage());
            activePurchaseCall = null;
        }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        Log.i(TAG, "Application resumed. Checking BillingClient connection.");
        connectToBillingClient(null, null);
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
        }
        super.handleOnDestroy();
    }
}
