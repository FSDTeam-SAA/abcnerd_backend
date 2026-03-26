import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { chatbotService } from "./chatbot.service";
import type { IChatIdentity } from "./chatbot.interface";
import { userModel } from "../usersAuth/user.models";



// start chat without history (one-shot)
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;

  const { _id: userId } = req.user as any;
  const user = await userModel.findById(userId).select("balance");
  //check if user has enough balance to chat (allow -1 for unlimited)
  if (user && user.balance.aiChat !== -1 && user.balance.aiChat <= 0) {
    return ApiResponse.sendError(res, 403, "You reached your daily chat limit.");
  }

  const result = await chatbotService.chat(message, { userId });

  //decrease balance if user chatting successfully — costs more tokens

  //decrease balance if user chatting successfully and not unlimited
  if (user && user.balance.aiChat !== -1) {
    user.balance.aiChat -= 1; //decrease balance by 1 for each chat
    await user.save();
  }
  ApiResponse.sendSuccess(res, 200, "Message sent", result);
});

// chat with history (loads today's history as context)
export const chatWithHistory = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const { _id: userId } = req.user as any;
  //check if user has enough balance to chat (allow -1 for unlimited)
  const user = await userModel.findById(userId)
  if (user && user.balance.aiChat !== -1 && user.balance.aiChat <= 0) {
    return ApiResponse.sendError(res, 403, "You reached your daily chat limit.");
  }

  const result = await chatbotService.chatWithHistory(message, { userId });

  //decrease balance if user chatting successfully — costs more tokens

  //decrease balance if user chatting successfully and not unlimited
  if (user && user.balance.aiChat !== -1) {
    user.balance.aiChat -= 1; //decrease balance by 1 for each chat
    await user.save();
  }
  ApiResponse.sendSuccess(res, 200, "Message sent", result);
});

// get all history for current user/session
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { _id: userId } = req.user as any;

  const result = await chatbotService.getHistory({ userId });
  ApiResponse.sendSuccess(res, 200, "History fetched", result);
});

// get history for a specific day
export const getHistoryByDay = asyncHandler(async (req: Request, res: Response) => {
  const { dayKey } = req.params;
  const { _id: userId } = req.user as any;

  const result = await chatbotService.getHistoryByDay({ userId }, dayKey as string);
  ApiResponse.sendSuccess(res, 200, "History fetched", result);
});

// soft-delete history for a specific day
export const deleteHistoryByDay = asyncHandler(async (req: Request, res: Response) => {
  const { dayKey } = req.params;
  const { _id: userId } = req.user as any;

  await chatbotService.deleteHistoryByDay({ userId }, dayKey as string);
  ApiResponse.sendSuccess(res, 200, "History deleted", null);
});