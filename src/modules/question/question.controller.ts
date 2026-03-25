import { Request, Response } from "express";

import {
  createQuestionService,
  getAllQuestionsService,
  getQuestionByIdService,
  updateQuestionService,
  deleteQuestionService,
  toggleQuestionStatusService,
} from "./question.service";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

export const createQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const question = await createQuestionService(req.body);
    ApiResponse.sendSuccess(
      res,
      201,
      "Question created successfully",
      question,
    );
  },
);

export const getAllQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getAllQuestionsService(req);
    ApiResponse.sendSuccess(res, 200, "Questions fetched successfully", result);
  },
);

export const getQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw new Error("Question ID not found in params");
    const question = await getQuestionByIdService(id);
    ApiResponse.sendSuccess(
      res,
      200,
      "Question fetched successfully",
      question,
    );
  },
);

export const updateQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw new Error("Question ID not found in params");
    const question = await updateQuestionService(id, req.body);
    ApiResponse.sendSuccess(
      res,
      200,
      "Question updated successfully",
      question,
    );
  },
);

export const deleteQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw new Error("Question ID not found in params");
    await deleteQuestionService(id);
    ApiResponse.sendSuccess(res, 200, "Question deleted successfully");
  },
);

export const toggleQuestionStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw new Error("Question ID not found in params");
    const question = await toggleQuestionStatusService(id);
    ApiResponse.sendSuccess(
      res,
      200,
      `Question ${question.isActive ? "activated" : "deactivated"} successfully`,
      question,
    );
  },
);
