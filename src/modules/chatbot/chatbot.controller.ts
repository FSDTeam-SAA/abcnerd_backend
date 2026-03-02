import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { chatbotService } from "./chatbot.service";
import { ICreateChatbot, IUpdateChatbot, IChatbotQuery } from "./chatbot.interface";

// ─────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────

export const createChatbot = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateChatbot = req.body;
  const item = await chatbotService.createChatbot(data);
  ApiResponse.sendSuccess(res, 201, "Chatbot created successfully", item);
});

export const getAllChatbots = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as IChatbotQuery;
  const result = await chatbotService.getAllChatbots(query);
  ApiResponse.sendSuccess(res, 200, "Chatbots fetched successfully", result);
});

export const getChatbotById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await chatbotService.getChatbotById(id as string);
  ApiResponse.sendSuccess(res, 200, "Chatbot fetched successfully", item);
});

export const getChatbotBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const item = await chatbotService.getChatbotBySlug(slug as string);
  ApiResponse.sendSuccess(res, 200, "Chatbot fetched successfully", item);
});

export const updateChatbot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: IUpdateChatbot = req.body;
  const item = await chatbotService.updateChatbot(id as string, data);
  ApiResponse.sendSuccess(res, 200, "Chatbot updated successfully", item);
});

export const deleteChatbot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await chatbotService.deleteChatbot(id as string );
  ApiResponse.sendSuccess(res, 200, "Chatbot deleted successfully", null);
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await chatbotService.toggleStatus(id as string);
  ApiResponse.sendSuccess(res, 200, `Chatbot status set to ${item.status}`, item);
});

// ─────────────────────────────────────────
// GEMINI
// ─────────────────────────────────────────

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const result = await chatbotService.chat(message);
  ApiResponse.sendSuccess(res, 200, "Message sent", result);
});

export const chatWithHistory = asyncHandler(async (req: Request, res: Response) => {
  const { message, history = [] } = req.body;
  const result = await chatbotService.chatWithHistory(message, history);
  ApiResponse.sendSuccess(res, 200, "Message sent", result);
});

export const chatWithBot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, history = [] } = req.body;
  const result = await chatbotService.chatWithBot(id as string, message, history);
  ApiResponse.sendSuccess(res, 200, "Message sent", result);
});

export const generateDescription = asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body;
  const result = await chatbotService.generateChatbotDescription(title);
  ApiResponse.sendSuccess(res, 200, "Description generated", result);
});