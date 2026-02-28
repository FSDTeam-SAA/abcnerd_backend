import { model, Schema } from "mongoose";
import { ILearning } from "./learning.interface";
import { WordType } from "../wordmanagement/wordmanagement.interface";

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
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    wordType: {
      type: String,
      enum: Object.values(WordType),
      default: WordType.ENTIRE,
      required: true,
    },
    swipeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// save এর আগেই estimatedTime বের করে নাও
learningSchema.pre("save", function (next) {
  this.estimatedTime = this.dailyGoal / 2;
});

export const Learning = model<ILearning>("Learning", learningSchema);
