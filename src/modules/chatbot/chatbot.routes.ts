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

// ─── Chat ─────────────────────────────────────────────────────────────────────

// Context-unaware chat — sends the message without prior context. Persists both user and AI turns to the DB.
router.post("/message", authGuard, validateRequest(chatMessageSchema), chat);

// Context-aware chat — loads today's history as prior context
// Body: { message: string, sessionId?: string }
router.post(
  "/message/history",
  authGuard,
  validateRequest(chatMessageSchema),
  chatWithHistory,
);

// ─── History ──────────────────────────────────────────────────────────────────

// Get all daily chat docs for the current user/session (newest first)
router.get("/history", authGuard, getHistory);

// Get a single day's chat doc — dayKey format: YYYY-MM-DD
router.get("/history/:dayKey", authGuard, getHistoryByDay);

// Soft-delete a single day's chat doc — dayKey format: YYYY-MM-DD
router.delete("/history/:dayKey", authGuard, deleteHistoryByDay);

export const chatbotRoute = router;
