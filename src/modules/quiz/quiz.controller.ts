import { Request, Response } from "express";
import {
  generateQuizService,
  getUserQuizHistoryService,
  getQuizByIdService,
  getAllQuizzesAdminService,
  retakeQuizService,
} from "./quiz.service";
import { Types } from "mongoose";
import ApiResponse from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export const generateQuiz = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { categoryId, questionCount } = req.query;

    const quiz = await generateQuizService(
      userId as Types.ObjectId,
      categoryId as string,
      questionCount ? Number(questionCount) : 10,
    );

    ApiResponse.sendSuccess(res, 201, "Quiz generated successfully", quiz);
  },
);

export const getUserQuizHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const quizzes = await getUserQuizHistoryService(
      req.user?._id as Types.ObjectId,
    );
    ApiResponse.sendSuccess(
      res,
      200,
      "Quiz history fetched successfully",
      quizzes,
    );
  },
);

export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.quizId as string;
  if (!quizId) throw new Error("Quiz ID not found in params");

  const quiz = await getQuizByIdService(
    req.user?._id as Types.ObjectId,
    quizId,
  );
  ApiResponse.sendSuccess(res, 200, "Quiz fetched successfully", quiz);
});

export const getAllQuizzesAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getAllQuizzesAdminService(req);
    ApiResponse.sendSuccess(
      res,
      200,
      "All quizzes fetched successfully",
      result,
    );
  },
);

export const retakeQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const quizId = req.params.quizId as string;
    if (!quizId) throw new Error("Quiz ID not found in params");

    const result = await retakeQuizService(userId as Types.ObjectId, quizId);
    ApiResponse.sendSuccess(res, 200, "Quiz restarted successfully", result);
  },
);
