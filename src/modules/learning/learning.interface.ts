import { Types } from "mongoose";
import { WordType } from "../wordmanagement/wordmanagement.interface";

export interface ILearning {
  _id: Types.ObjectId;
  user: Types.ObjectId; // কোন user এর session
  dailyGoal: number;
  estimatedTime: number; // auto = dailyGoal / 2
  learningCategory: string; // enum string
  isActive: boolean; // একটাই active session থাকবে
  wordType: WordType;
  swipeCount: number;
}
