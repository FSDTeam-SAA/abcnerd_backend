import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateSubscription } from "./subscription.interface";
import { subscriptionService } from "./subscription.service";
import mongoose from "mongoose";
import CustomError from "../../helpers/CustomError";


export const createSubscriptionCheckout = asyncHandler(
  async (req: any, res: Response) => {
    const { planId } = req.body as { planId: string };

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      throw new CustomError(400, "Invalid planId");
    }

    if (!req.user?._id || !req.user?.email) {
      throw new CustomError(401, "Unauthorized");
    }

    const result = await subscriptionService.createCheckoutSession({
      userId: req.user._id,
      planId,
      userEmail: req.user.email,
    });

    ApiResponse.sendSuccess(res, 200, "Checkout session created", result);
  }
);

// Toss success redirect: ?customerKey=...&authKey=...
export const successPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.successPayment(req.query);
  ApiResponse.sendSuccess(res, 200, "Payment success", result);
});

export const failedPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.failedPayment(req.query);
  ApiResponse.sendSuccess(res, 200, "Payment failed", result);
});

// Serves the Toss Billing Auth HTML page for the Flutter WebView.
// Flutter loads this URL directly — no data:// URI needed, bypassing WKWebView security.
// Query params: clientKey, customerKey, successUrl, failUrl, customerName?, customerEmail?, amount?, orderId?, orderName?
export const billingAuthPage = asyncHandler(async (req: Request, res: Response) => {
  const { clientKey, customerKey, successUrl, failUrl, customerName, customerEmail, amount, orderId, orderName } = req.query as Record<string, string>;

  if (!clientKey || !customerKey || !successUrl || !failUrl) {
    res.status(400).send("Missing required query parameters: clientKey, customerKey, successUrl, failUrl");
    return;
  }

  // We are migrating this to requestPayment bypass for Test mock cards limitation
  const paymentData: Record<string, any> = { 
    amount: parseInt(amount || '0', 10),
    orderId: orderId || customerKey, 
    orderName: orderName || "Subscription",
    customerName,
    customerEmail,
    successUrl, 
    failUrl,
    // Forces English interface & restricts to Visa/Mastercard, 
    // circumventing Korean App Card deep-link crashes completely!
    useInternationalCardOnly: true, 
  };
  const customerDataJson = JSON.stringify(paymentData);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Toss Secure Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d0d0d; display: flex; align-items: center; justify-content: center; height: 100vh; }
    .loader { color: #fff; font-family: -apple-system, sans-serif; font-size: 16px; text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Redirecting to secure payment...</p>
  </div>
  <script src="https://js.tosspayments.com/v1"></script>
  <script>
    (function() {
      try {
        var tossPayments = TossPayments('${clientKey}');
        tossPayments.requestPayment('카드', ${customerDataJson});
      } catch (e) {
        document.querySelector('.loader p').textContent = 'Error: ' + e.message;
        console.error('BillingAuth error:', e);
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(html);
});


export const createPaymentIntent = asyncHandler(async (req: any, res: Response) => {
  const { planId } = req.body as { planId: string };

  if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
    throw new CustomError(400, "Invalid planId");
  }

  if (!req.user?._id || !req.user?.email) {
    throw new CustomError(401, "Unauthorized");
  }

  const result = await subscriptionService.createPaymentIntent({
    userId: req.user._id,
    planId,
    userEmail: req.user.email,
  });

  ApiResponse.sendSuccess(res, 200, "Payment intent created", result);
});




export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.getPaymentHistory(req.query);
  ApiResponse.sendSuccess(res, 200, "Payment history fetched", result.data, result.meta);
});

export const deletePaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await subscriptionService.deletePaymentHistory(id);
  ApiResponse.sendSuccess(res, 200, "Payment history deleted successfully", result);
});
