import { Request, Response } from "express";
import { fetchLearningService } from "./learning.service";
import { CategoryWord } from "../categoryword/categoryword.interface";

export const fetchLearningController = async (req: Request, res: Response) => {
  try {
    const { userId, category, dailyGoal } = req.body;

    if (!userId || !category || !dailyGoal) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // Validate category enum
    if (!Object.values(CategoryWord).includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const words = await fetchLearningService({ userId, category, dailyGoal });

    res.json({
      message: "Learning words fetched successfully",
      dailyGoal,
      words: words.map((w) => ({
        _id: w._id,
        word: w.word,
        description: w.description,
        synonyms: w.synonyms,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
