// chatbot.service.ts
import { GoogleGenAI } from "@google/genai";
import { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import type {
  ChatHistory,
  IChatIdentity,
  IChatResponse,
} from "./chatbot.interface";
import { DailyChatHistoryModel } from "./chatbot.models";
import { NotificationModel } from "../notification/notification.models";
import { getIo } from "../../socket/server";
import {
  NotificationStatus,
  NotificationType,
} from "../notification/notification.interface";
import { userModel } from "../usersAuth/user.models";
import { Learning } from "../learning/learning.models";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey as string });

// System instruction to prime the AI's behavior. Can be adjusted for different personalities or use cases.

const SYSTEM_INSTRUCTION = `
You are Swap Lang AI — the in-app English learning companion for the Swap Lang app.
Rules:
- Reply ONLY in English.
- Be concise, friendly, encouraging, accurate, and personalized to the learner.
- Help with vocabulary, slang, translation, pronunciation, grammar, usage, and natural conversation practice.
- Act like a supportive AI language partner, not a generic assistant.
- Use the user's saved profile, learning progress, current study context, and recent chat history when it improves the answer.
- If the user recently learned words, naturally guide the conversation toward practicing them when appropriate.
- Prefer short interactive practice over long lectures. Use 1 to 3 relevant recent words at a time, not too many at once.
- When the user seems open to practice, continue the conversation with a short follow-up question, mini roleplay, or sentence challenge.
- If the user makes a language mistake, gently correct it, explain briefly, and keep the conversation going naturally.
- If the user asks meaning + examples, respond with a short meaning, one clear explanation, and natural real-life examples.
- If the user asks for translation, also help them say it more naturally if useful.
- Keep most answers compact unless the user asks for more detail.
- Do not call the app SwipeLang or describe it as a slang-only app unless the user explicitly says that.
`;

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 2048;
const TEMPERATURE = 0.9;
const MAX_HISTORY_CHARS = 28000;
const RECENT_HISTORY_DAYS = 7;
const MAX_RECENT_VOCAB_WORDS = 12;
const MAX_REVIEW_WORDS = 8;
const MAX_LATEST_CATEGORIES = 3;

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
  maxChars = MAX_HISTORY_CHARS,
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

const getUserVocabularyContext = async (userId?: Types.ObjectId | string): Promise<string> => {
  if (!userId) return "";
  try {
    const Progress = (await import("../progress/progress.models")).Progress;
    const p = await Progress.findOne({ user: userId })
      .populate("memorized", "word")
      .populate("reviewLater", "word")
      .lean();

    if (!p) return "";

    const recentMemorizedWords = (p.memorized as any[] | undefined)
      ?.map((w) => w?.word)
      .filter(Boolean)
      .slice(-MAX_RECENT_VOCAB_WORDS) ?? [];

    const reviewWords = (p.reviewLater as any[] | undefined)
      ?.map((w) => w?.word)
      .filter(Boolean)
      .slice(-MAX_REVIEW_WORDS) ?? [];

    const contextParts = [
      recentMemorizedWords.length
        ? `Recently learned vocabulary: ${recentMemorizedWords.join(", ")}.`
        : null,
      reviewWords.length
        ? `Words marked for review: ${reviewWords.join(", ")}.`
        : null,
    ].filter(Boolean);

    if (!contextParts.length) return "";

    return `\n\nVocabulary context:\n- ${contextParts.join("\n- ")}`;
  } catch (e) {
    return "";
  }
};

const getUserProfileContext = async (
  userId?: Types.ObjectId | string,
): Promise<string> => {
  if (!userId) return "";

  try {
    const user = await userModel
      .findById(userId)
      .select(
        "name selfIntroduction dailyGoal city country provider subscription.plan subscription.status",
      )
      .lean();

    if (!user) return "";

    const contextParts = [
      user.name ? `Learner name: ${user.name}.` : null,
      user.selfIntroduction
        ? `Self introduction: ${user.selfIntroduction}.`
        : null,
      user.dailyGoal ? `Daily learning goal: ${user.dailyGoal} words.` : null,
      user.city || user.country
        ? `Location: ${[user.city, user.country].filter(Boolean).join(", ")}.`
        : null,
      user.provider ? `Sign-in provider: ${user.provider}.` : null,
      user.subscription?.plan
        ? `Plan: ${user.subscription.plan} (${user.subscription.status ?? "unknown"}).`
        : null,
    ].filter(Boolean);

    if (!contextParts.length) return "";

    return `\n\nUser profile context:\n- ${contextParts.join("\n- ")}`;
  } catch (e) {
    return "";
  }
};

const getUserLearningCompanionContext = async (
  userId?: Types.ObjectId | string,
): Promise<string> => {
  if (!userId) return "";

  try {
    const Progress = (await import("../progress/progress.models")).Progress;
    const [progress, activeSession] = await Promise.all([
      Progress.findOne({ user: userId }).lean(),
      Learning.findOne({ user: userId, isActive: true })
        .select("learningCategory swipeCount sessionWordLimit")
        .lean(),
    ]);

    const latestCategories =
      progress?.latestLearningCategory?.slice(0, MAX_LATEST_CATEGORIES) ?? [];

    const todayStats = progress?.dailyStat;
    const contextParts = [
      activeSession?.learningCategory
        ? `Current active study category: ${activeSession.learningCategory}.`
        : null,
      activeSession?.sessionWordLimit
        ? `Current practice chunk: ${activeSession.swipeCount ?? 0}/${activeSession.sessionWordLimit} words completed.`
        : null,
      latestCategories.length
        ? `Recently studied categories: ${latestCategories.join(", ")}.`
        : null,
      todayStats
        ? `Today's learning stats: memorized ${todayStats.memorizedCount}, review later ${todayStats.reviewLaterCount}, remaining goal ${todayStats.remainingGoal}.`
        : null,
      progress?.nextVideoAt
        ? `The user may be at a practice checkpoint after the latest study flow.`
        : null,
    ].filter(Boolean);

    if (!contextParts.length) return "";

    return `\n\nLearning companion context:\n- ${contextParts.join("\n- ")}`;
  } catch (e) {
    return "";
  }
};

const getRecentChatHistory = async (
  identity: IChatIdentity,
): Promise<ChatHistory> => {
  const query = identity.userId
    ? { userId: new Types.ObjectId(identity.userId), isDeleted: false }
    : { sessionId: identity.sessionId ?? "anonymous", isDeleted: false };

  const docs = await DailyChatHistoryModel.find(query)
    .sort({ dayKey: -1 })
    .limit(RECENT_HISTORY_DAYS)
    .select("dayKey messages")
    .lean();

  const sortedDocs = docs.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  const combinedHistory: ChatHistory = [];

  for (const doc of sortedDocs) {
    const messages = (doc.messages ?? []) as ChatHistory;
    combinedHistory.push(...messages);
  }

  return trimHistoryByChars(combinedHistory);
};

const buildSystemInstruction = async (
  identity: IChatIdentity,
): Promise<string> => {
  const [profileContext, vocabContext, companionContext] = await Promise.all([
    getUserProfileContext(identity.userId),
    getUserVocabularyContext(identity.userId),
    getUserLearningCompanionContext(identity.userId),
  ]);

  return `${SYSTEM_INSTRUCTION}${profileContext}${vocabContext}${companionContext}`;
};

// Retrieves today's chat doc for the user, or creates it if it doesn't exist.
const getOrCreateDayDoc = async (identity: IChatIdentity) => {
  const dayKey = getDayKeyUTC();
  const { filter, setOnInsert } = buildDayFilter(identity, dayKey);

  // Check if document already exists before upserting
  const existing = await DailyChatHistoryModel.findOne(filter);

  // Upsert and get the document (new: true always returns the doc after upsert)
  const dayDoc = await DailyChatHistoryModel.findOneAndUpdate(
    filter,
    { $setOnInsert: setOnInsert },
    { upsert: true, returnDocument: 'after' },
  );

  // Trigger first-chat notification only when document is newly created
  if (!existing && identity.userId) {
    const userId = String(identity.userId);
    const title = "AI chat mission arrived";
    const description =
      "Your daily speaking mission is ready! Chat with AI to complete it.";

    const notif = await NotificationModel.create({
      receiverId: userId,
      title,
      description,
      type: NotificationType.MISSION,
      status: NotificationStatus.UNREAD,
    });

    const io = getIo();
    io.to(userId).emit("ai_mission:arrived", {
      message: title,
      description,
    });
    io.to(userId).emit("notification:new", notif);
  }

  return dayDoc;
};

// One-shot chat — sends the message without prior context. Persists both user and AI turns to the DB.
const chat = async (
  message: string,
  identity: IChatIdentity = {},
): Promise<IChatResponse> => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  const dayDoc = await getOrCreateDayDoc(identity);
  if (!dayDoc) throw new CustomError(500, "Failed to initialize chat session");

  const systemInstruction = await buildSystemInstruction(identity);

  const aiResponse = await handleGeminiError(async () => {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: message,
      config: {
        systemInstruction,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
    });
    return result.text ?? "";
  });

  if (!(dayDoc as any).messages) {
    (dayDoc as any).messages = [];
  }
  (dayDoc as any).messages.push(
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: aiResponse }] },
  );
  await (dayDoc as any).save();
  return { response: aiResponse };
};

// Context-aware chat — loads today's history as context and sends it with the message. Persists both user and AI turns to the DB.
const chatWithHistory = async (
  message: string,
  identity: IChatIdentity = {},
): Promise<IChatResponse> => {
  if (!message?.trim()) throw new CustomError(400, "Message is required");

  if (!identity.userId) {
    throw new CustomError(401, "Authentication required to use chat history");
  }

  const dayDoc = await getOrCreateDayDoc(identity);
  if (!dayDoc) throw new CustomError(500, "Failed to initialize chat session");

  if (!(dayDoc as any).messages) {
    (dayDoc as any).messages = [];
  }
  const [trimmedHistory, systemInstruction] = await Promise.all([
    getRecentChatHistory(identity),
    buildSystemInstruction(identity),
  ]);

  const aiResponse = await handleGeminiError(async () => {
    const chat = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
      history: trimmedHistory.map((msg) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: msg.parts.map((p) => ({ text: p.text })),
      })),
    });

    const result = await chat.sendMessage({ message });
    return result.text ?? "";
  });

  (dayDoc as any).messages.push(
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: aiResponse }] },
  );
  await (dayDoc as any).save();

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
    { returnDocument: 'after' },
  );
};

export const chatbotService = {
  chat,
  chatWithHistory,
  getHistory,
  getHistoryByDay,
  deleteHistoryByDay,
};
