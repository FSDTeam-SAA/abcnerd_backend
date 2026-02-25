import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateSubscriptionPlan } from "./subscriptionplan.interface";
import { subscriptionplanService } from "./subscriptionplan.service";

//TODO: create subscriptionplan
export const createSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateSubscriptionPlan = req.body;
  const item = await subscriptionplanService.createSubscriptionPlan(data);
  ApiResponse.sendSuccess(res, 200, "SubscriptionPlan created", item);
});

//TODO: get single subscriptionplan
export const getSubscriptionPlanById = asyncHandler(async (req: Request, res: Response) => {
  const subscriptionplanId = req.params.subscriptionplanId as string;
  if (!subscriptionplanId) throw new Error("SubscriptionPlanId not found");
  const subscriptionplan = await subscriptionplanService.getSubscriptionPlanById(subscriptionplanId as string);
  ApiResponse.sendSuccess(res, 200, "SubscriptionPlan fetched", subscriptionplan);
});

//TODO: get all subscriptionplan with pagination and search and filter --- IGNORE ---
export const getAllSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionplans, meta } = await subscriptionplanService.getAllSubscriptionPlan(req);
  ApiResponse.sendSuccess(res, 200, "SubscriptionPlan fetched", subscriptionplans, meta);
});

//TODO: update subscriptionplan
export const updateSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const subscriptionplanId = req.params.subscriptionplanId as string;
  if (!subscriptionplanId) throw new Error("SubscriptionPlanId not found");
  const data = req.body;
  const subscriptionplan = await subscriptionplanService.updateSubscriptionPlan(subscriptionplanId as string, data);
  ApiResponse.sendSuccess(res, 200, "SubscriptionPlan updated", subscriptionplan);
});

//TODO: delete subscriptionplan (soft delete)
export const deleteSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const subscriptionplanId = req.params.subscriptionplanId as string;
  if (!subscriptionplanId) throw new Error("SubscriptionPlanId not found");
  await subscriptionplanService.deleteSubscriptionPlan(subscriptionplanId as string);
  ApiResponse.sendSuccess(res, 200, "SubscriptionPlan deleted");
});
