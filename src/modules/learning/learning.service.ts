import { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import { Learning } from "./learning.models";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { Progress } from "../progress/progress.models";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";

export const createLearningSessionService = async (
  userId: Types.ObjectId,
  category: string,
  dailyGoal: number,
  wordType: string,
) => {
  await Learning.findOneAndUpdate(
    { user: userId, isActive: true },
    { isActive: false },
  );

  const session = await Learning.create({
    user: userId,
    dailyGoal,
    learningCategory: category,
    isActive: true,
    wordType: wordType,
  });

  return session;
};

export const fetchLearningWordsService = async (
  userId: Types.ObjectId,
  category: string,
  dailyGoal: number,
  wordType: string,
) => {
  const categoryDoc = await CategoryWordModel.findOne({ name: category });
  if (!categoryDoc) throw new CustomError(404, "Catergory not found");

  const progress = await Progress.findOne({ user: userId });
  const excludedIds = [
    ...(progress?.memorized || []),
    ...(progress?.reviewLater || []),
  ];

  const words = await WordmanagementModel.find({
    categoryWordId: categoryDoc._id,
    status: "active",
    wordType: wordType,
    _id: { $nin: excludedIds.map((id) => id.toString()) },
  }).limit(dailyGoal);

  return words;
};

export const wordActionService = async (
  userId: Types.ObjectId,
  wordId: string,
  action: "memorized" | "reviewLater",
) => {
  const oppositeField = action === "memorized" ? "reviewLater" : "memorized";
  const userProgress = await Progress.findOne({ user: userId });

  if (
    (userProgress?.memorized?.includes(new Types.ObjectId(wordId)) &&
      action === "memorized") ||
    (userProgress?.reviewLater?.includes(new Types.ObjectId(wordId)) &&
      action === "reviewLater")
  ) {
    throw new CustomError(400, "Word already marked as " + action);
  }

  if (
    userProgress?.memorized?.includes(new Types.ObjectId(wordId)) &&
    action === "reviewLater"
  ) {
    throw new CustomError(400, "Word already marked as memorized");
  }

  let progress: any = await Progress.findOneAndUpdate(
    { user: userId },
    {
      $addToSet: { [action]: new Types.ObjectId(wordId) },
      $pull: { [oppositeField]: new Types.ObjectId(wordId) },
    },
    { new: true, upsert: true },
  );

  if (action !== "memorized") {
    return { progress, shouldShowVideo: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastAction = progress.lastActionDate
    ? new Date(progress.lastActionDate)
    : null;
  if (lastAction) lastAction.setHours(0, 0, 0, 0);

  const isConsecutiveDay =
    lastAction &&
    today.getTime() - lastAction.getTime() === 24 * 60 * 60 * 1000;

  const newScore = (progress.score || 0) + 1;
  const newStreak = isConsecutiveDay ? (progress.streak || 0) + 1 : 1;

  const shouldShowVideo = newScore % 10 === 0;

  const nextVideoAt = shouldShowVideo
    ? (progress.nextVideoAt || 10) + 10
    : progress.nextVideoAt;

  progress = await Progress.findOneAndUpdate(
    { user: userId },
    {
      score: newScore,
      streak: newStreak,
      lastActionDate: new Date(),
      nextVideoAt,
    },
    { new: true },
  );

  return { progress, shouldShowVideo };
};

export const getActiveSessionService = async (userId: Types.ObjectId) => {
  const session = await Learning.findOne({ user: userId, isActive: true });
  if (!session) throw new CustomError(404, "No active session found");
  return session;
};
