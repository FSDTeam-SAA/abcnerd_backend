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
    memorized: [{ type: Schema.Types.ObjectId, ref: "Wordmanagement" }],
    reviewLater: [{ type: Schema.Types.ObjectId, ref: "Wordmanagement" }],
    markFavorite: [{ type: Schema.Types.ObjectId, ref: "Wordmanagement" }],
    streak: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    lastActionDate: { type: Date, default: null },
    nextVideoAt: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// progressSchema.pre("save", function (next) {
//   if (this.isModified("score")) {
//     if (this.score > 0 && this.score % 10 === 0) {
//       this.nextVideoAt = true;
//     } else {
//       this.nextVideoAt = false;
//     }
//   }
// });
export const Progress = model<IProgress>("Progress", progressSchema);
