import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { Progress } from "./progress.models";

// ── 1. User এর progress summary ──
export const getProgressService = async (userId: Types.ObjectId) => {
  const progress = await Progress.findOne({ user: userId });
  if (!progress) throw new CustomError(404, "Progress not found");

  return {
    score: progress.score,
    streak: progress.streak,
    nextVideoAt: progress.nextVideoAt,
    memorizedCount: progress.memorized.length,
    reviewLaterCount: progress.reviewLater.length,
    lastActionDate: progress.lastActionDate,
  };
};

// ── 2. Memorized বা ReviewLater word গুলো details সহ ──
export const getProgressWordsService = async (
  userId: Types.ObjectId,
  type: "memorized" | "reviewLater",
) => {
  const progress = await Progress.findOne({ user: userId }).populate({
    path: type,
    select: "word synonyms description slug",
  });

  if (!progress) throw new CustomError(404, "Progress not found");

  return progress[type];
};
