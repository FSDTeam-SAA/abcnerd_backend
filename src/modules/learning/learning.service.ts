import { Types } from "mongoose";
import { CategoryWord } from "../categoryword/categoryword.interface";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { ProgressModel } from "../progress/progress.models";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";

export const fetchLearningService = async (
  userId: Types.ObjectId,
  category: CategoryWord,
  dailyGoal: number,
) => {
  // 1️⃣ get category _id
  const categoryDoc = await CategoryWordModel.findOne({ name: category });
  if (!categoryDoc) throw new Error("Category not found");

  // 2️⃣ get user progress
  const progress = await ProgressModel.findOne({ user: userId });
  const excludedIds = [
    ...(progress?.memorized || []),
    ...(progress?.reviewLater || []),
  ];

  const excludedIdsStr = excludedIds.map((id) => id.toString());

  const words = await WordmanagementModel.find({
    categoryWordId: categoryDoc._id,
    _id: { $nin: excludedIdsStr }, // <-- cast to string array
  }).limit(dailyGoal);

  // action

  return words;
};
