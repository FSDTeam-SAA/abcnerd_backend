import { NextFunction, Request, Response } from "express";
import {
  createQuestionService,
  getAllQuestionsService,
  getQuestionByIdService,
  updateQuestionService,
  deleteQuestionService,
  toggleQuestionStatusService,
} from "./question.service";

export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const question = await createQuestionService(req.body);
    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (err) {
    next(err as Error);
  }
};

export const getAllQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { categoryId } = req.query;
    const questions = await getAllQuestionsService(categoryId as string);
    res.status(200).json({
      success: true,
      total: questions.length,
      data: questions,
    });
  } catch (err) {
    next(err as Error);
  }
};

export const getQuestionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const question = await getQuestionByIdService(req.params.id as string);
    res.status(200).json({ success: true, data: question });
  } catch (err) {
    next(err as Error);
  }
};

export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const question = await updateQuestionService(
      req.params.id as string,
      req.body,
    );
    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (err) {
    next(err as Error);
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteQuestionService(req.params.id as string);
    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (err) {
    next(err as Error);
  }
};

export const toggleQuestionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const question = await toggleQuestionStatusService(req.params.id as string);
    res.status(200).json({
      success: true,
      message: `Question ${question.isActive ? "activated" : "deactivated"} successfully`,
      data: question,
    });
  } catch (err) {
    next(err as Error);
  }
};
