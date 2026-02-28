import express from "express";
import {
    createChatbot,
    getAllChatbots,
    getChatbotById,
    getChatbotBySlug,
    updateChatbot,
    deleteChatbot,
    toggleStatus,
    chat,
    chatWithHistory,
    chatWithBot,
    generateDescription,
} from "./chatbot.controller";
import {
    createChatbotSchema,
    updateChatbotSchema,
    chatbotQuerySchema,
    chatMessageSchema,
    generateDescSchema,
} from "./chatbot.validation";
import { validateRequest } from "../../middleware/validateRequest.middleware";
// import { authMiddleware } from "../../middleware/auth.middleware";
// import { adminMiddleware } from "../../middleware/admin.middleware";

const router = express.Router();

// ─────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────

router.post(
    "/start-chat",
    // authMiddleware, adminMiddleware,
    validateRequest(createChatbotSchema),
    createChatbot
);

router.get(
    "/get-all",
    validateRequest(chatbotQuerySchema),
    getAllChatbots
);

router.get("/get-chat/slug/:slug", getChatbotBySlug);

router.get("/get-chat/:id", getChatbotById);

router.patch(
    "/update-chat/:id",
    // authMiddleware, adminMiddleware,
    validateRequest(updateChatbotSchema),
    updateChatbot
);

router.patch(
    "/toggle-status/:id",
    // authMiddleware, adminMiddleware,
    toggleStatus
);

router.delete(
    "/delete-chat/:id",
    // authMiddleware, adminMiddleware,
    deleteChatbot
);

// ─────────────────────────────────────────
// GEMINI
// ─────────────────────────────────────────

router.post(
    "/message",
    // authMiddleware,
    validateRequest(chatMessageSchema),
    chat
);

router.post(
    "/message/history",
    // authMiddleware,
    validateRequest(chatMessageSchema),
    chatWithHistory
);

router.post(
    "/message/:id",
    // authMiddleware,
    validateRequest(chatMessageSchema),
    chatWithBot
);

router.post(
    "/generate-description",
    // authMiddleware, adminMiddleware,
    validateRequest(generateDescSchema),
    generateDescription
);

export const chatbotRoute = router;