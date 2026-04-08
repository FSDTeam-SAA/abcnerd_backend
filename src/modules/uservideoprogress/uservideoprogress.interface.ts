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
  availableAt: Date; // video is not available before this date
  watchCount: number;
}
