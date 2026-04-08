import { Types } from "mongoose";

export interface IDailyStat {
  date: Date;
  swipedCount: number; // memorized + reviewLater
  memorizedCount: number;
  reviewLaterCount: number;
  remainingGoal: number; // dailyGoal - swipedCount
  isGoalNotified: boolean;
}

export interface IProgress {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  memorized: Types.ObjectId[];
  reviewLater: Types.ObjectId[];
  markFavorite: Types.ObjectId[];
  attemptedQuestions: Types.ObjectId[]; // questions that were already attempted
  streak: number;
  score: number;
  lastActionDate: Date | null;
  nextVideoAt: boolean;
  dailyStat: IDailyStat | null;
  latestLearningCategory: string[] | null;
}
