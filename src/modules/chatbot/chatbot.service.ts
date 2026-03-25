// chatbot.service.ts
import { GoogleGenAI } from "@google/genai";
import mongoose, { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import type { ChatHistory, IChatIdentity, IChatResponse } from "./chatbot.interface";
import { DailyChatHistoryModel } from "./chatbot.models";
import { Progress } from "../progress/progress.models";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey as string });

// System instruction to prime the AI's behavior. Can be adjusted for different personalities or use cases.

const SYSTEM_INSTRUCTION = `
You are SwipeLang AI — a modern slang-focused translator and vocabulary assistant.
Rules:
- Reply ONLY in English.
- Be concise, friendly, and accurate.
- If user asks meaning + examples, respond with short meaning + real-life usage examples.
- You have access to the user's learned vocabulary. Use these words in your examples or conversation when relevant to help reinforce learning.
`;

const getUserVocabularyContext = async (userId?: string): Promise<string> => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return "";
  try {
    const progress = await Progress.findOne({ user: new mongoose.Types.ObjectId(userId) }).populate({
      path: "memorized",
      select: "word",
      options: { limit: 50, sort: { createdAt: -1 } }
    });
    if (!progress || !progress.memorized || (progress.memorized as any[]).length === 0) return "";
    const words = (progress.memorized as any[]).map(w => w.word).filter(Boolean).join(", ");
    return words ? `\nUser's Learned Vocabulary (use these when relevant): ${words}` : "";
  } catch (err) {
    console.error("Error fetching user vocabulary context:", err);
    return "";
  }
};

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 2048;
const TEMPERATURE = 0.9;
const MAX_HISTORY_CHARS = 12000;

// helper function to handle Gemini API errors and throw user-friendly messages

const handleGeminiError = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (err.message?.includes("429"))
      throw new CustomError(429, "AI quota exceeded. Please try again later.");
    if (err.message?.includes("404"))
      throw new CustomError(500, "AI model not found. Please contact support.");
    throw new CustomError(500, err.message || "AI service error");
  }
};

const getDayKeyUTC = (date = new Date()): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Trims chat history to fit within the max character limit, starting from the most recent messages.
const trimHistoryByChars = (
  history: ChatHistory,
  maxChars = MAX_HISTORY_CHARS
): ChatHistory => {
  let total = 0;
  const kept: ChatHistory = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (!msg) continue;
    const charCount = msg.parts.map((p) => p.text ?? "").join(" ").length;
    total += charCount;
    if (total > maxChars) break;
    kept.push(msg);
  }

  return kept.reverse();
};

// Builds the filter and setOnInsert objects for upserting the daily chat doc based on user/session identity.
const buildDayFilter = (identity: IChatIdentity, dayKey: string) => {
  if (identity.userId) {
    const uid = new Types.ObjectId(identity.userId);
    return {
      filter: { userId: uid, dayKey },
      setOnInsert: { userId: uid, dayKey },
    };
  }

  const sid = identity.sessionId ?? "anonymous";
  return {
    filter: { sessionId: sid, dayKey },
    setOnInsert: { sessionId: sid, dayKey },
  };
};

// Retrieves today's chat doc for the user, or creates it if it doesn't exist.
const getOrCreateDayDoc = async (identity: IChatIdentity) => {
  const dayKey = getDayKeyUTC();
  const { filter, setOnInsert } = buildDayFilter(identity, dayKey);

  return DailyChatHistoryModel.findOneAndUpdate(
    filter,
    { $setOnInsert: setOnInsert },
    { upsert: true, returnDocument: "after" }
  );
};

// One-shot chat — sends the message without prior context. Persists both user and AI turns to the DB.
const chat = async (
  message: string,
  identity: IChatIdentity = {}
): Promise<IChatResponse> => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  const dayDoc = await getOrCreateDayDoc(identity);

  const vocabContext = await getUserVocabularyContext(identity.userId);
  const aiResponse = await handleGeminiError(async () => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + vocabContext,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
    });
    return response.text ?? "";
  });

  dayDoc.messages.push(
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: aiResponse }] }
  );
  await dayDoc.save();
  return { response: aiResponse };
};

// Context-aware chat — loads today's history as context and sends it with the message. Persists both user and AI turns to the DB.
const chatWithHistory = async (
  message: string,
  identity: IChatIdentity = {}
): Promise<IChatResponse> => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  if (!identity.userId) {
    throw new CustomError(401, "Authentication required to use chat history");
  }

  const dayDoc = await getOrCreateDayDoc(identity);
  const trimmedHistory = trimHistoryByChars(dayDoc.messages as ChatHistory);

  const vocabContext = await getUserVocabularyContext(identity.userId);
  const aiResponse = await handleGeminiError(async () => {
    const contents = [
      ...trimmedHistory.map((msg) => ({
        role: msg.role,
        parts: msg.parts.map((p) => ({ text: p.text })),
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + vocabContext,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
    });

    return response.text ?? "";
  });

  dayDoc.messages.push(
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: aiResponse }] }
  );
  await dayDoc.save();

  return { response: aiResponse };
};

// Retrieves all non-deleted daily chat docs for the user/session, sorted by newest first.
const getHistory = async (identity: IChatIdentity) => {
  const query = identity.userId
    ? { userId: new Types.ObjectId(identity.userId), isDeleted: false }
    : { sessionId: identity.sessionId ?? "anonymous", isDeleted: false };

  return DailyChatHistoryModel.find(query).sort({ dayKey: -1 }).lean();
};

// Retrieves a specific day's chat doc based on the dayKey and user/session identity.
const getHistoryByDay = async (identity: IChatIdentity, dayKey: string) => {
  const { filter } = buildDayFilter(identity, dayKey);
  return DailyChatHistoryModel.findOne({ ...filter, isDeleted: false }).lean();
};

// Soft-deletes a specific day's chat doc by setting isDeleted to true.
const deleteHistoryByDay = async (identity: IChatIdentity, dayKey: string) => {
  const { filter } = buildDayFilter(identity, dayKey);
  return DailyChatHistoryModel.findOneAndUpdate(
    filter,
    { $set: { isDeleted: true } },
    { returnDocument: "after" }
  );
};

export const chatbotService = {
  chat,
  chatWithHistory,
  getHistory,
  getHistoryByDay,
  deleteHistoryByDay,
};