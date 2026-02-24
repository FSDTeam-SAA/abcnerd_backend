import { Request, Response } from "express";
import { updateProgressService } from "./progress.service";

export const updateProgressController = async (req: Request, res: Response) => {
  try {
    const { userId, wordId, action } = req.body;

    const { progress, unlockVideo } = await updateProgressService(
      userId,
      wordId,
      action,
    );

    res.json({
      message: "Progress updated successfully",
      progress,
      unlockVideo,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
