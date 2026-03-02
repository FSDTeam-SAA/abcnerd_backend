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

//Chatbot routes
router.post("/message",authGuard, validateRequest(chatMessageSchema), chat);
router.post("/message/history", authGuard, validateRequest(chatMessageSchema), chatWithHistory);

// Get chat history for the authenticated user
router.get("/history", authGuard, getHistory);
router.get("/history/:dayKey", authGuard, getHistoryByDay);
router.delete("/history/:dayKey", authGuard, deleteHistoryByDay);

export const chatbotRoute = router;