import { Types } from "mongoose";
import { CategoryWord } from "../categoryword/categoryword.interface";
import CustomError from "../../helpers/CustomError";
import { LearningModel } from "./learning.models";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { ProgressModel } from "../progress/progress.models";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";

export const createLearningSessionService = async (
  userId: Types.ObjectId,
  category: CategoryWord,
  dailyGoal: number,
) => {
  await LearningModel.findOneAndUpdate(
    { user: userId, isActive: true },
    { isActive: false },
  );

  const session = await LearningModel.create({
    user: userId,
    dailyGoal,
    learningCategory: category,
    isActive: true,
  });

  return session;
};

export const fetchLearningWordsService = async (
  userId: Types.ObjectId,
  category: CategoryWord,
  dailyGoal: number,
) => {
  const categoryDoc = await CategoryWordModel.findOne({ name: category });
  if (!categoryDoc) throw new CustomError(404, "Catergory not found");

  const progress = await ProgressModel.findOne({ user: userId });
  const excludedIds = [
    ...(progress?.memorized || []),
    ...(progress?.reviewLater || []),
  ];

  const words = await WordmanagementModel.find({
    categoryWordId: categoryDoc._id,
    status: "active",
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

  let progress: any = await ProgressModel.findOneAndUpdate(
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

  progress = await ProgressModel.findOneAndUpdate(
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
  const session = await LearningModel.findOne({ user: userId, isActive: true });
  if (!session) throw new CustomError(404, "কোনো active session নেই");
  return session;
};
