// chatbot.route.ts
import express from "express";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import {
  chat,
  chatWithHistory,
  getHistory,
  getHistoryByDay,
  deleteHistoryByDay,
} from "./chatbot.controller";
import { chatMessageSchema } from "./chatbot.validation";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

// Chatbot routes
router.post("/message", authGuard as any, validateRequest(chatMessageSchema), chat);
router.post("/message/history", authGuard as any, validateRequest(chatMessageSchema), chatWithHistory);

// Get chat history for the authenticated user
router.get("/history", authGuard as any, getHistory);
router.get("/history/:dayKey", authGuard as any, getHistoryByDay);
router.delete("/history/:dayKey", authGuard as any, deleteHistoryByDay);

export const chatbotRoute = router;