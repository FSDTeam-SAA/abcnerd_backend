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

export const TossWebhook = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.handleTossWebhook(req);
  ApiResponse.sendSuccess(res, 200, "Webhook handled successfully", result);
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
