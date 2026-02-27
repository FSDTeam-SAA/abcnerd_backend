import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { Progress } from "./progress.models";
import { WordType } from "../wordmanagement/wordmanagement.interface";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";

// ── 1. User এর progress summary ──
export const getProgressService = async (userId: Types.ObjectId) => {
  const progress = await Progress.findOne({ user: userId });
  if (!progress) throw new CustomError(404, "Progress not found");

  return {
    score: progress.score,
    streak: progress.streak,
    nextVideoAt: progress.nextVideoAt,
    memorizedCount: progress.memorized.length,
    favoriteCount: progress.markFavorite.length,
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

export const getReviewLaterService = async (
  userId: Types.ObjectId,
  options: {
    page?: number;
    limit?: number;
    wordType?: WordType;
  },
) => {
  const { page = 1, limit = 10, wordType } = options;

  const progress = await Progress.findOne({ user: userId });

  if (!progress) {
    throw new Error("Progress not found");
  }

  const filter: any = {
    _id: { $in: progress.reviewLater },
  };

  if (wordType) {
    filter.wordType = wordType;
  }

  const skip = (page - 1) * limit;

  const [words, total] = await Promise.all([
    WordmanagementModel.find(filter)
      .select("word synonyms description slug wordType")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),

    WordmanagementModel.countDocuments(filter),
  ]);

  return {
    data: words,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const toggleFavoriteService = async (
  userId: Types.ObjectId,
  wordId: string,
) => {
  const progress = await Progress.findOne({ user: userId });
  if (!progress) throw new CustomError(404, "Progress not found");

  const wordObjectId = new Types.ObjectId(wordId);

  let action: "added" | "removed";

  if (progress.markFavorite?.includes(wordObjectId)) {
    // Already favorite → remove
    progress.markFavorite = progress.markFavorite.filter(
      (id) => !id.equals(wordObjectId),
    );
    action = "removed";
  } else {
    // Not favorite → add
    progress.markFavorite = progress.markFavorite || [];
    progress.markFavorite.push(wordObjectId);
    action = "added";
  }

  await progress.save();

  return { action, markFavorite: progress.markFavorite };
};
