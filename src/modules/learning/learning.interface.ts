//TODO: customize as needed

import { Types } from "mongoose";
import { CategoryWord } from "../categoryword/categoryword.interface";

export interface ILearning {
  _id: string;
  dailyGoal: number;
  EstimatedTime: number;
  streak: string;
  action: boolean;
  learningCategory: Types.ObjectId;
}
