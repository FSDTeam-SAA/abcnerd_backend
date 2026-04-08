import { Schema, model } from "mongoose";
import { IVideo } from "./video.interface";

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "WordCategory",
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: "",
    },
    cloudinaryUrl: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// ensure unique order within the same category
videoSchema.index({ category: 1, order: 1 }, { unique: true });

export const VideoModel = model<IVideo>("Video", videoSchema);
