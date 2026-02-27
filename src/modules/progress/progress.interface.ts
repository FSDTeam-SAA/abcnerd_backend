import { Types } from "mongoose";

export interface IProgress {
  user: Types.ObjectId;
  memorized: Types.ObjectId[];
  reviewLater: Types.ObjectId[];
  markFavorite: Types.ObjectId[];
  streak: number;
  score: number;
  lastActionDate: Date | null;
  nextVideoAt: boolean;
}
