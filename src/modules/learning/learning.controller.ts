import { NextFunction, Request, Response } from "express";
import {
  createLearningSessionService,
  fetchLearningWordsService,
  wordActionService,
  getActiveSessionService,
} from "./learning.service";
import { Types } from "mongoose";

// POST /api/learning/session
export const createLearningSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const { dailyGoal, learningCategory } = req.body;
    const { wordType } = req.query;

    // console.log(wordType);

    const session = await createLearningSessionService(
      userId as Types.ObjectId,
      learningCategory as string,
      dailyGoal,
      wordType as string,
    );

    res.status(201).json({
      success: true,
      message: "Learning session started successfully",
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/learning/words
export const fetchLearningWords = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;

    // active session থেকে category আর dailyGoal নাও
    const session = await getActiveSessionService(userId as Types.ObjectId);

    console.log(session.wordType);

    const words = await fetchLearningWordsService(
      userId as Types.ObjectId,
      session.learningCategory,
      session.dailyGoal,
      session.wordType,
    );

    res.status(200).json({
      success: true,
      message: "words found successfully",
      totalWords: words.length,
      data: words,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/learning/word-action
export const wordAction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { wordId, action } = req.body;

    const result = await wordActionService(
      userId as Types.ObjectId,
      wordId,
      action,
    );

    res.status(200).json({
      success: true,
      message: `Word marked as "${action}`,
      data: result.progress,
      shouldShowVideo: result.shouldShowVideo, // true হলে frontend video দেখাবে
    });
  } catch (err) {
    next(err);
  }
};
