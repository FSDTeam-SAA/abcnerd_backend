import { model, Schema } from "mongoose";
import { ILearning } from "./learning.interface";
import { CategoryWord } from "../categoryword/categoryword.interface";

const learningSchema = new Schema<ILearning>(
  {
    dailyGoal: {
      type: Number,
      required: true,
      trim: true,
    },
    EstimatedTime: {
      type: Number,
      required: true,
    },
    streak: {
      type: String,
      required: true,
    },
    learningCategory: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: Boolean,
      required: true, 
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

learningSchema.pre("save", function (next) {
  this.EstimatedTime = this.dailyGoal / 2;
});

export const LearningModel = model<ILearning>("Learning", learningSchema);
