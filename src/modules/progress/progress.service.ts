import { Types } from "mongoose";
import { ProgressModel } from "./progress.models";

export const updateProgressService = async (
  userId: string,
  wordId: string,
  action: "memorized" | "reviewLater",
) => {
  let progress = await ProgressModel.findOne({ user: userId });

  if (!progress) {
    progress = await ProgressModel.create({ user: new Types.ObjectId(userId) });
  }

  const today = new Date().toDateString();
  const lastActionDay = progress.lastActionDate
    ? progress.lastActionDate.toDateString()
    : null;

  // update streak
  if (lastActionDay === today) {
    // same day → streak no change
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActionDay === yesterday.toDateString()) {
      progress.streak += 1; // consecutive day
    } else {
      progress.streak = 1; // streak reset
    }
  }

  progress.lastActionDate = new Date();

  // update action arrays & score
  if (action === "memorized") {
    if (!progress.memorized.includes(wordId as any)) {
      progress.memorized.push(new Types.ObjectId(wordId));
      progress.score += 1;
    }
  } else if (action === "reviewLater") {
    if (!progress.reviewLater.includes(wordId as any)) {
      progress.reviewLater.push(new Types.ObjectId(wordId));
    }
  }

  // check video unlock
  let unlockVideo = false;
  if (progress.score >= progress.nextVideoAt) {
    unlockVideo = true;
    progress.nextVideoAt += 10;
  }

  await progress.save();

  return { progress, unlockVideo };
};
