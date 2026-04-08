import { Schema, model } from "mongoose";
import { IUserVideoProgress } from "./uservideoprogress.interface";

const userVideoProgressSchema = new Schema<IUserVideoProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
    },
    skipCount: {
      type: Number,
      default: 0,
    },
    watchedAt: {
      type: Date,
    },
    availableAt: {
      type: Date,
      required: true,
    },
    watchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// each user has only one progress record per video
userVideoProgressSchema.index({ user: 1, video: 1 }, { unique: true });

export const UserVideoProgressModel = model<IUserVideoProgress>(
  "UserVideoProgress",
  userVideoProgressSchema,
);
