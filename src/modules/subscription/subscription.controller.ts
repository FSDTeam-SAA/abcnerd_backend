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

    // ✅ validate planId
    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      throw new CustomError(400, "Invalid planId");
    }

    // ✅ validate user
    if (!req.user?._id || !req.user?.email) {
      throw new CustomError(401, "Unauthorized");
    }

    const result = await subscriptionService.createCheckoutSession({
      userId: req.user._id,
      planId,
      userEmail: req.user.email,
      stripeCustomerId: req.user.stripeCustomerId || null,
    });

    ApiResponse.sendSuccess(res, 200, "Checkout session created", result);
  }
);


//: success payment

export const successPayment = asyncHandler(async (req: Request, res: Response) => {
  const session_id = String(req.query.session_id || "").trim();
  if (!session_id) {
    throw new CustomError(400, "session_id is required");
  }

  const result = await subscriptionService.successPayment(session_id);
  ApiResponse.sendSuccess(res, 200, "Payment success", result);
});

//: payment failed
export const failedPayment = asyncHandler(async (req: Request, res: Response) => {
  const session_id = String(req.query.session_id || "").trim();
  if (!session_id) {
    throw new CustomError(400, "session_id is required");
  }

  const result = await subscriptionService.failedPayment(session_id);
  ApiResponse.sendSuccess(res, 200, "Payment failed", result);
});


//!: create payment intent for own checkout page

export const createPaymentIntent = asyncHandler(async (req: any, res: Response) => {
  const { planId } = req.body as { planId: string };

  // ✅ validate planId
  if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
    throw new CustomError(400, "Invalid planId");
  }

  // ✅ validate user
  if (!req.user?._id || !req.user?.email) {
    throw new CustomError(401, "Unauthorized");
  }

  const result = await subscriptionService.createPaymentIntent({
    userId: req.user._id,
    planId,
    userEmail: req.user.email,
    stripeCustomerId: req.user.stripeCustomerId || null,
  });

  ApiResponse.sendSuccess(res, 200, "Payment intent created", result);
});


//: implement webhook handler to listen Stripe events and update subscription status accordingly (e.g. handle cases where user does not return to success page, or payment fails after checkout)
// This is important to ensure subscription status is accurate even if user does not return to success page after checkout, or if payment fails after checkout (e.g. due to insufficient funds, card issues, etc.) - we can listen for events like 'checkout.session.completed', 'invoice.payment_succeeded', 'invoice.payment_failed', etc. from Stripe and update our subscription records accordingly to reflect the true status of the subscription and avoid issues with users having access when they shouldn't or losing access when they should have it.      
export const StripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.handleStripeWebhook(req);
  ApiResponse.sendSuccess(res, 200, "Webhook handled successfully", result);
});


