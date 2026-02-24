import { Schema, model, Document, Types } from "mongoose";
import { IProgress } from "./progress.interface";

const progressSchema = new Schema<IProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    memorized: [{ type: Schema.Types.ObjectId, ref: "Word" }],
    reviewLater: [{ type: Schema.Types.ObjectId, ref: "Word" }],
    streak: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    lastActionDate: { type: Date, default: null },
    nextVideoAt: { type: Number, default: 10 },
  },
  { timestamps: true },
);

export const ProgressModel = model<IProgress>("Progress", progressSchema);
