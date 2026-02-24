import { Types } from "mongoose";
import { CategoryWord } from "../categoryword/categoryword.interface";

export interface ILearning {
  _id: Types.ObjectId;
  user: Types.ObjectId; // কোন user এর session
  dailyGoal: number;
  estimatedTime: number; // auto = dailyGoal / 2
  learningCategory: CategoryWord; // enum string
  isActive: boolean; // একটাই active session থাকবে
}
