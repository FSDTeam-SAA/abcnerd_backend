import { GoogleGenAI } from "@google/genai";
import { ChatbotModel } from "./chatbot.models";
import { ICreateChatbot, IUpdateChatbot, IChatbotQuery } from "./chatbot.interface";
import CustomError from "../../helpers/CustomError";
import config from "../../config";

// ── Gemini setup ──────────────────────────
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey as string });

// ── error wrapper ─────────────────────────
const handleGeminiError = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    // console.log(err);

    if (err.message?.includes("429")) {
      throw new CustomError(429, "AI quota exceeded. Please try again later.");
    }
    if (err.message?.includes("404")) {
      throw new CustomError(500, "AI model not found. Please contact support.");
    }
    throw new CustomError(500, err.message || "AI service error");
  }
};

// ─────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────

const createChatbot = async (data: ICreateChatbot) => {
  const item = await ChatbotModel.create(data);
  if (!item) throw new CustomError(400, "Chatbot not created");
  return item;
};

const getAllChatbots = async (query: IChatbotQuery) => {
  const { page = 1, limit = 10, search, status } = query;
  const skip = (page - 1) * limit;

  const filter: any = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    ChatbotModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ChatbotModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

const getChatbotById = async (id: string) => {
  const item = await ChatbotModel.findOne({ _id: id, isDeleted: false });
  if (!item) throw new CustomError(404, "Chatbot not found");
  return item;
};

const getChatbotBySlug = async (slug: string) => {
  const item = await ChatbotModel.findOne({ slug, isDeleted: false });
  if (!item) throw new CustomError(404, "Chatbot not found");
  return item;
};

const updateChatbot = async (id: string, data: IUpdateChatbot) => {
  const item = await ChatbotModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!item) throw new CustomError(404, "Chatbot not found");
  return item;
};

const deleteChatbot = async (id: string) => {
  const item = await ChatbotModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!item) throw new CustomError(404, "Chatbot not found");
  return item;
};

const toggleStatus = async (id: string) => {
  const item = await ChatbotModel.findOne({ _id: id, isDeleted: false });
  if (!item) throw new CustomError(404, "Chatbot not found");
  item.status = item.status === "active" ? "inactive" : "active";
  await item.save();
  return item;
};

// ─────────────────────────────────────────
// GEMINI
// ─────────────────────────────────────────

type ChatHistory = { role: string; parts: { text: string }[] }[];

// One-shot — no history
const chat = async (message: string) => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  return await handleGeminiError(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: message,
      config: {
        systemInstruction: "You are a helpful AI assistant. Be concise, friendly, and accurate.",
      },
    });

    return { response: response.text };
  });
};

// Continuous — sends history every request
const chatWithHistory = async (message: string, history: ChatHistory = []) => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  return await handleGeminiError(async () => {
    const contents = [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        maxOutputTokens: 2048,
        temperature: 0.9,
        systemInstruction: "You are a helpful AI assistant. Be concise, friendly, and accurate.",
      },
    });

    const replyText = response.text ?? "";

    const updatedHistory: ChatHistory = [
      ...history,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: replyText }] },
    ];

    return { response: replyText, history: updatedHistory };
  });
};

// Chat with a specific chatbot's personality from DB
const chatWithBot = async (
  chatbotId: string,
  message: string,
  history: ChatHistory = []
) => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  const chatbot = await ChatbotModel.findOne({ _id: chatbotId, isDeleted: false });
  if (!chatbot) throw new CustomError(404, "Chatbot not found");
  if (chatbot.status === "inactive") throw new CustomError(400, "This chatbot is inactive");

  return await handleGeminiError(async () => {
    const contents = [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        maxOutputTokens: 2048,
        temperature: 0.9,
        systemInstruction: `You are "${chatbot.title}". ${chatbot.description ?? ""}
                Be helpful, concise, and always stay in character.`,
      },
    });

    const replyText = response.text ?? "";

    const updatedHistory: ChatHistory = [
      ...history,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: replyText }] },
    ];

    return {
      chatbot: { id: chatbot._id, title: chatbot.title },
      response: replyText,
      history: updatedHistory,
    };
  });
};

// Auto-generate description using AI
const generateChatbotDescription = async (title: string) => {
  if (!title?.trim()) throw new CustomError(400, "Title is required");

  return await handleGeminiError(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a short professional description (max 100 words) 
            for an AI chatbot named "${title}". 
            Return only the description text, no extra commentary.`,
    });

    return { description: response.text?.trim() ?? "" };
  });
};

export const chatbotService = {
  // CRUD
  createChatbot,
  getAllChatbots,
  getChatbotById,
  getChatbotBySlug,
  updateChatbot,
  deleteChatbot,
  toggleStatus,
  // Gemini
  chat,
  chatWithHistory,
  chatWithBot,
  generateChatbotDescription,
};