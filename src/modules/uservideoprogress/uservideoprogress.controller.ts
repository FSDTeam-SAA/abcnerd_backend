import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { Types } from "mongoose";
import {
  getNextVideoService,
  markVideoCompleteService,
  skipVideoService,
  getUserCategoryProgressService,
} from "./uservideoprogress.service";

// frontend will call this every 10 words in session
export const getNextVideo = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as Types.ObjectId; // comes from auth middleware
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const video = await getNextVideoService(userId, categoryId as string);

    ApiResponse.sendSuccess(
      res,
      200,
      video ? "Next video fetched" : "No video available",
      video,
    );
  },
);

// User watched a video
export const markVideoComplete = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as Types.ObjectId;
    const { videoId } = req.params;

    if (!videoId) {
      throw new Error("Video ID is required");
    }

    const progress = await markVideoCompleteService(userId, videoId as string);

    ApiResponse.sendSuccess(res, 200, "Video marked as completed", progress);
  },
);

// User skipped a video
export const skipVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id as Types.ObjectId;
  const { videoId } = req.params;

  if (!videoId) {
    throw new Error("Video ID is required");
  }

  const progress = await skipVideoService(userId, videoId as string);

  ApiResponse.sendSuccess(res, 200, "Video skipped", progress);
});

// all video progress for user's category
export const getUserCategoryProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as Types.ObjectId;
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const progressList = await getUserCategoryProgressService(
      userId,
      categoryId as string,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      "Progress fetched successfully",
      progressList,
    );
  },
);
