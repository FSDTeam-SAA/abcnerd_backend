import { Request, Response } from "express";
import {
  submitQuizService,
  getAttemptHistoryService,
  getAttemptByIdService,
  getAllAttemptsAdminService,
  getAttemptsByQuizAdminService,
} from "./quizattempt.service";
import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.quizId as string;
  if (!quizId) throw new Error("Quiz ID not found in params");

  const result = await submitQuizService(
    req.user?._id as Types.ObjectId,
    quizId,
    req.body.answers,
  );
  ApiResponse.sendSuccess(res, 200, "Quiz submitted successfully", result);
});

export const getAttemptHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getAttemptHistoryService(
      req.user?._id as Types.ObjectId,
    );
    ApiResponse.sendSuccess(
      res,
      200,
      "Attempt history fetched successfully",
      attempts,
    );
  },
);

export const getAttemptById = asyncHandler(
  async (req: Request, res: Response) => {
    const attemptId = req.params.attemptId as string;
    if (!attemptId) throw new Error("Attempt ID not found in params");

    const attempt = await getAttemptByIdService(
      req.user?._id as Types.ObjectId,
      attemptId,
    );
    ApiResponse.sendSuccess(res, 200, "Attempt fetched successfully", attempt);
  },
);

export const getAllAttemptsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getAllAttemptsAdminService();
    ApiResponse.sendSuccess(
      res,
      200,
      "All attempts fetched successfully",
      attempts,
    );
  },
);

export const getAttemptsByQuizAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const quizId = req.params.quizId as string;
    if (!quizId) throw new Error("Quiz ID not found in params");

    const attempts = await getAttemptsByQuizAdminService(quizId);
    ApiResponse.sendSuccess(
      res,
      200,
      "Quiz attempts fetched successfully",
      attempts,
    );
  },
);
