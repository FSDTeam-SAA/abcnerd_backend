import { Request, Response } from "express";
import {
  createLearningSessionService,
  fetchLearningWordsService,
  wordActionService,
  getActiveSessionService,
} from "./learning.service";
import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

// POST /api/learning/session
export const createLearningSession = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id as Types.ObjectId;
    const { dailyGoal, learningCategory } = req.body;
    const { wordType } = req.query;

    const session = await createLearningSessionService(
      userId as Types.ObjectId,
      learningCategory as string,
      dailyGoal,
      wordType as string,
    );

    ApiResponse.sendSuccess(
      res,
      201,
      "Learning session started successfully",
      session,
    );
  },
);

// GET /api/learning/words
export const fetchLearningWords = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id as Types.ObjectId;

    const session = await getActiveSessionService(userId);

    if (!session) {
      return ApiResponse.sendError(
        res,
        400,
        "No active learning session found",
      );
    }

    const words = await fetchLearningWordsService(
      userId,
      session.learningCategory,
      session.dailyGoal,
      session.wordType,
    );

    ApiResponse.sendSuccess(res, 200, "Words fetched successfully", {
      total: words.length,
      data: words,
    });
  },
);

// PATCH /api/learning/word-action
export const wordAction = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id as Types.ObjectId;
  const { wordId, action } = req.body;

  const result = await wordActionService(userId, wordId, action);

  ApiResponse.sendSuccess(res, 200, `Word marked as "${action}" successfully`, {
    progress: result.progress,
    shouldShowVideo: result.shouldShowVideo,
  });
});
