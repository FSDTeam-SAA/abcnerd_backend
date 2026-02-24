import { model, Schema } from "mongoose";
import { ILearning } from "./learning.interface";
import { CategoryWord } from "../categoryword/categoryword.interface";

const learningSchema = new Schema<ILearning>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dailyGoal: {
      type: Number,
      required: true,
    },
    estimatedTime: {
      type: Number,
    },
    learningCategory: {
      type: String,
      enum: Object.values(CategoryWord),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// save এর আগেই estimatedTime বের করে নাও
learningSchema.pre("save", function (next) {
  this.estimatedTime = this.dailyGoal / 2;
});

export const Learning = model<ILearning>("Learning", learningSchema);
