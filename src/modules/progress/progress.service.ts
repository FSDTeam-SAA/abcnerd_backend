import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { Progress } from "./progress.models";
import { WordType } from "../wordmanagement/wordmanagement.interface";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";
import { paginationHelper } from "../../utils/pagination";
import { userModel } from "../usersAuth/user.models";

export const getProgressService = async (userId: Types.ObjectId) => {
  const progress = await Progress.findOne({ user: userId });
  if (!progress) throw new CustomError(404, "Progress not found");

  const user = await userModel.findById(userId).select("dailyGoal");
  if (!user) throw new CustomError(404, "User not found");

  const dailyGoal = user.dailyGoal || 0;
  const memorizedToday = progress.dailyStat?.memorizedCount || 0;

  const remainingGoal = Math.max(dailyGoal - memorizedToday, 0);

  return {
    score: progress.score,
    streak: progress.streak,
    nextVideoAt: progress.nextVideoAt,
    memorizedCount: progress.memorized.length,
    favoriteCount: progress.markFavorite.length,
    reviewLaterCount: progress.reviewLater.length,
    lastActionDate: progress.lastActionDate,
    latestLearningCategory: progress.latestLearningCategory,
    dailyGoal,
    memorizedToday,
    remainingGoal,
  };
};

// ── 2. Memorized বা ReviewLater word গুলো details সহ ──
export const getProgressWordsService = async (
  userId: Types.ObjectId,
  type: "memorized" | "reviewLater",
) => {
  const progress = await Progress.findOne({ user: userId }).populate({
    path: type,
    select: "word synonyms examples description slug",
  });

  if (!progress) throw new CustomError(404, "Progress not found");

  return progress[type];
};

export const getReviewLaterService = async (req: any) => {
  const {
    page: pagebody,
    limit: limitbody,
    sortBy = "desc",
    isactive = "all",
    categoryType,
    search,
    wordType,
  } = req.query;

  const userId = req?.user?._id;
  const role = req?.user?.role;

  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new CustomError(400, "Invalid user id");
  }

  const { page, limit, skip } = paginationHelper(pagebody, limitbody);

  const progress = await Progress.findOne({ user: userId });

  if (!progress) {
    throw new CustomError(404, "Progress not found");
  }

  let filter: any = {
    _id: { $in: progress.reviewLater || [] },
  };

  // filter status

  if (role === "admin") {
    const allowedStatus = ["active", "inactive", "blocked", "all"];

    if (!allowedStatus.includes(isactive)) {
      throw new CustomError(
        400,
        "Invalid isactive value. Allowed: active, inactive, blocked, all",
      );
    }

    if (isactive !== "all") {
      filter.status = isactive;
    }
  } else {
    filter.status = "active";
  }

  // category type filter

  if (categoryType) {
    filter.categoryType = categoryType;
  }

  //word type filter

  if (wordType) {
    filter.wordType = wordType;
  }

  ///search filter

  if (search) {
    filter.$or = [
      { word: { $regex: search, $options: "i" } },
      { synonyms: { $regex: search, $options: "i" } },
    ];
  }

  if (role !== "admin") {
    filter.status = "active";
  }

  //sort

  const allowedSortBy = ["asc", "desc"];
  if (!allowedSortBy.includes(sortBy)) {
    throw new CustomError(
      400,
      "Invalid sortBy value. Allowed values are 'asc', 'desc'",
    );
  }

  const sortValue = sortBy === "asc" ? 1 : -1;

  const [words, totalReviewLater] = await Promise.all([
    WordmanagementModel.find(filter)
      .select(
        "word synonyms description examples slug wordType categoryType status createdAt",
      )
      .sort({ createdAt: sortValue })
      .skip(skip)
      .limit(limit),

    WordmanagementModel.countDocuments(filter),
  ]);

  console.log(words, "from serviced");

  const totalPage = Math.ceil(totalReviewLater / limit);

  return {
    wordmanagements: words,
    meta: {
      page,
      limit,
      totalPage,
      totalReviewLater,
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
