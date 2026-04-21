import { Types } from "mongoose";
import { WordType } from "../wordmanagement/wordmanagement.interface";

export interface ILearning {
  _id: Types.ObjectId;
  user: Types.ObjectId; // session for which user
  dailyGoal: number;
  sessionWordLimit: number;
  estimatedTime: number; // auto = dailyGoal / 2
  learningCategory: string; // enum string
  categoryId: Types.ObjectId;
  isActive: boolean; // only one active session allowed
  wordType: WordType;
  swipeCount: number;
  completionPercentage: number;
  memorizedWords: number;
  totalWordsInCategory: number;
}
