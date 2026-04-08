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

// Session এ প্রতি 10 word পর frontend এই call করবে
export const getNextVideo = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as Types.ObjectId; // Auth middleware theke asche
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

// User video দেখল
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

// User video skip করল
export const skipVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id as Types.ObjectId;
  const { videoId } = req.params;

  if (!videoId) {
    throw new Error("Video ID is required");
  }

  const progress = await skipVideoService(userId, videoId as string);

  ApiResponse.sendSuccess(res, 200, "Video skipped", progress);
});

// User এর category র সব video progress
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
