import { Types } from "mongoose";

export interface IProgress {
  user: Types.ObjectId;
  memorized: Types.ObjectId[];
  reviewLater: Types.ObjectId[];
  streak: number;
  score: number;
  lastActionDate: Date | null;
  nextVideoAt: number;
}
