import { Types } from "mongoose";

export type VideoProgressStatus = "pending" | "completed" | "skipped";

export interface IUserVideoProgress {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  video: Types.ObjectId;
  status: VideoProgressStatus;
  skipCount: number;
  watchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  availableAt: Date; // এই date এর আগে video দেখাবে না
  watchCount: number;
}
