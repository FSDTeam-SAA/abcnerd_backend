import { Request, Response } from "express";

import { Types } from "mongoose";

import {
  getActiveQuizzesService,
  getAllAttemptsAdminService,
  getAttemptByIdService,
  getAttemptHistoryService,
  getAttemptsByQuizAdminService,
  startQuizService,
  submitQuizService,
} from "./quizattempt.service";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

// ── User ──────────────────────────────────────────────────

export const getActiveQuizzes = asyncHandler(
  async (req: Request, res: Response) => {
    const quizzes = await getActiveQuizzesService();

    ApiResponse.sendSuccess(res, 200, "Active quizzes fetched successfully", {
      total: quizzes.length,
      data: quizzes,
    });
  },
);

export const startQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await startQuizService(req.params.quizId as string);

  ApiResponse.sendSuccess(res, 200, "Quiz started successfully", quiz);
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id as Types.ObjectId;
  const { answers } = req.body;

  const result = await submitQuizService(
    userId,
    req.params.quizId as string,
    answers,
  );

  ApiResponse.sendSuccess(res, 200, "Quiz submitted successfully", result);
});

export const getAttemptHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getAttemptHistoryService(
      req.user!._id as Types.ObjectId,
    );

    ApiResponse.sendSuccess(res, 200, "Attempt history fetched successfully", {
      total: attempts.length,
      data: attempts,
    });
  },
);

export const getAttemptById = asyncHandler(
  async (req: Request, res: Response) => {
    const attempt = await getAttemptByIdService(
      req.user!._id as Types.ObjectId,
      req.params.attemptId as string,
    );

    ApiResponse.sendSuccess(res, 200, "Attempt fetched successfully", attempt);
  },
);

// ── Admin ─────────────────────────────────────────────────

export const getAllAttemptsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getAllAttemptsAdminService();

    ApiResponse.sendSuccess(res, 200, "All attempts fetched successfully", {
      total: attempts.length,
      data: attempts,
    });
  },
);

export const getAttemptsByQuizAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getAttemptsByQuizAdminService(
      req.params.quizId as string,
    );

    ApiResponse.sendSuccess(res, 200, "Quiz attempts fetched successfully", {
      total: attempts.length,
      data: attempts,
    });
  },
);
