import { NextFunction, Request, Response } from "express";
import {
  getProgressService,
  getProgressWordsService,
  getReviewLaterService,
  toggleFavoriteService,
} from "./progress.service";
import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

// GET /api/progress
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id as Types.ObjectId;

  const result = await getProgressService(userId);

  ApiResponse.sendSuccess(res, 200, "Progress retrieved successfully", result);
});

// GET /api/progress/words?type=memorized
// GET /api/progress/words?type=reviewLater
export const getProgressWords = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as Types.ObjectId;
    const { type } = req.query;

    if (!["memorized", "reviewLater"].includes(type as string)) {
      return ApiResponse.sendError(
        res,
        400,
        "Allowed types: memorized, reviewLater",
      );
    }

    const words = await getProgressWordsService(
      userId,
      type as "memorized" | "reviewLater",
    );

    ApiResponse.sendSuccess(res, 200, `${type} words retrieved successfully`, {
      total: words.length,
      data: words,
    });
  },
);

// GET /api/progress/review-later?page=1&limit=10&wordType=Entire
export const getReviewLater = asyncHandler(
  async (req: Request, res: Response) => {
    const { wordmanagements: data, meta } = await getReviewLaterService(req);

    const message =
      data.length > 0
        ? "Review later words retrieved successfully"
        : "No review later words found";

    ApiResponse.sendSuccess(
      res,
      200,
      message,
      data,
      meta
    );
  },
);


export const toggleFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id as Types.ObjectId;
    const { wordId } = req.body;

    if (!wordId) {
      return ApiResponse.sendError(res, 400, "wordId is required");
    }

    const result = await toggleFavoriteService(userId, wordId);

    ApiResponse.sendSuccess(
      res,
      200,
      `Word has been ${result.action} to favorites`,
      { markFavorite: result.markFavorite },
    );
  },
);
