import { Request, Response } from "express";

import {
  createQuizService,
  getAllQuizzesAdminService,
  getQuizByIdAdminService,
  updateQuizService,
  deleteQuizService,
  toggleQuizStatusService,
} from "./quiz.service";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await createQuizService(req.body);

  ApiResponse.sendSuccess(res, 201, "Quiz created successfully", quiz);
});

export const getAllQuizzesAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const quizzes = await getAllQuizzesAdminService();

    ApiResponse.sendSuccess(res, 200, "All quizzes fetched successfully", {
      total: quizzes.length,
      data: quizzes,
    });
  },
);

export const getQuizByIdAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const quiz = await getQuizByIdAdminService(req.params.id as string);

    ApiResponse.sendSuccess(res, 200, "Quiz fetched successfully", quiz);
  },
);

export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await updateQuizService(req.params.id as string, req.body);

  ApiResponse.sendSuccess(res, 200, "Quiz updated successfully", quiz);
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  await deleteQuizService(req.params.id as string);

  ApiResponse.sendSuccess(res, 200, "Quiz deleted successfully", null);
});

export const toggleQuizStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const quiz = await toggleQuizStatusService(req.params.id as string);

    ApiResponse.sendSuccess(
      res,
      200,
      `Quiz ${quiz.isActive ? "activated" : "deactivated"} successfully`,
      quiz,
    );
  },
);
