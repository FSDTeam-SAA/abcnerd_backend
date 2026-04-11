import { Schema, model } from "mongoose";
import { IProgress } from "./progress.interface";

const dailyStatSchema = new Schema<any>(
  {
    date: { type: Date, required: true },
    swipedCount: { type: Number, default: 0 },
    memorizedCount: { type: Number, default: 0 },
    reviewLaterCount: { type: Number, default: 0 },
    remainingGoal: { type: Number, default: 0 },
    isGoalNotified: { type: Boolean, default: false },
  },
  { _id: false },
);

const progressSchema = new Schema<IProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    memorized: [{ type: Schema.Types.ObjectId, ref: "Wordmanagement" }],
    reviewLater: [{ type: Schema.Types.ObjectId, ref: "Wordmanagement" }],
    markFavorite: [{ type: Schema.Types.ObjectId, ref: "Wordmanagement" }],
    attemptedQuestions: [{ type: Schema.Types.ObjectId }], // question _ids
    streak: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    lastActionDate: { type: Date, default: null },
    nextVideoAt: { type: Boolean, default: false },
    dailyStat: { type: dailyStatSchema, default: null },
    latestLearningCategory: { type: [String], default: null },
  },
  { timestamps: true },
);

progressSchema.index({ user: 1, lastActionDate: -1 });
progressSchema.index({ user: 1, "dailyStat.date": 1 });

export const Progress = model<IProgress>("Progress", progressSchema);
