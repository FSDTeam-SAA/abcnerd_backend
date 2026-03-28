import { Types } from "mongoose";
import { NotificationModel } from "../notification/notification.models";
import { NotificationStatus, NotificationType } from "../notification/notification.interface";
import CustomError from "../../helpers/CustomError";
import { Learning } from "./learning.models";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { Progress } from "../progress/progress.models";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";
import { userModel } from "../usersAuth/user.models";
import { getIo } from "../../socket/server";

export const createLearningSessionService = async (
  userId: Types.ObjectId,
  category: Types.ObjectId,
  wordType: string,
) => {
  const user = await userModel.findById(userId).select("dailyGoal");
  if (!user) throw new CustomError(404, "User not found");

  const dailyGoal = user.dailyGoal;

  await Learning.findOneAndUpdate(
    { user: userId, isActive: true },
    { isActive: false },
  );

  const categoryDoc = await CategoryWordModel.findById(category).select("name");
  if (!categoryDoc) throw new CustomError(404, "Category not found");

  const session = await Learning.create({
    user: userId,
    dailyGoal,
    learningCategory: categoryDoc.name,
    isActive: true,
    wordType: wordType,
  });

  // ✅ Update latestLearningCategory (max 3)
  const progress = await Progress.findOne({ user: userId });

  if (progress) {
    let categories = progress.latestLearningCategory || [];
    categories = categories.filter((c) => c !== categoryDoc.name);
    categories.unshift(categoryDoc.name);
    categories = categories.slice(0, 3);
    progress.latestLearningCategory = categories;
    await progress.save();
  }

  return session;
};

export const fetchLearningWordsService = async (
  userId: Types.ObjectId,
  category: string,
  dailyGoal: number,
  wordType: string,
) => {
  const categoryDoc = await CategoryWordModel.findOne({ name: category });
  if (!categoryDoc) throw new CustomError(404, "Catergory not found");

  const progress = await Progress.findOne({ user: userId });
  const excludedIds = [
    ...(progress?.memorized || []),
    ...(progress?.reviewLater || []),
  ];

  const words = await WordmanagementModel.find({
    categoryWordId: categoryDoc._id,
    status: "active",
    wordType: wordType,
    _id: { $nin: excludedIds.map((id: any) => id.toString()) },
  }).limit(dailyGoal);

  return words;
};

export const wordActionService = async (
  userId: Types.ObjectId,
  wordId: string,
  action: "memorized" | "reviewLater",
) => {
  const oppositeField = action === "memorized" ? "reviewLater" : "memorized";
  const userProgress = await Progress.findOne({ user: userId });

  const user = await userModel
    .findById(userId)
    .select("email balance");

  if (!user) throw new CustomError(404, "User not found");

  if (user.balance.wordSwipe !== -1 && user.balance.wordSwipe <= 0)
    throw new CustomError(400, "your limit is over");

  if (
    (userProgress?.memorized?.includes(new Types.ObjectId(wordId)) &&
      action === "memorized") ||
    (userProgress?.reviewLater?.includes(new Types.ObjectId(wordId)) &&
      action === "reviewLater")
  ) {
    throw new CustomError(400, "Word already marked as " + action);
  }

  if (
    userProgress?.memorized?.includes(new Types.ObjectId(wordId)) &&
    action === "reviewLater"
  ) {
    throw new CustomError(400, "Word already marked as memorized");
  }

  let progress: any = await Progress.findOneAndUpdate(
    { user: userId },
    {
      $addToSet: { [action]: new Types.ObjectId(wordId) },
      $pull: { [oppositeField]: new Types.ObjectId(wordId) },
    },
    { new: true, upsert: true },
  );

  // ✅ Deduct balance for BOTH actions (if not unlimited)
  if (user.balance.wordSwipe !== -1) {
    user.balance.wordSwipe = user.balance.wordSwipe - 1;
    await user.save();
  }

  // ── Daily Stat Update ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const session = await Learning.findOne({ user: userId, isActive: true });
  const dailyGoal = session?.dailyGoal || 0;

  const existingStat = userProgress?.dailyStat;
  const isSameDay =
    existingStat?.date &&
    new Date(existingStat.date).setHours(0, 0, 0, 0) === today.getTime();

  const prevMemorizedCount = isSameDay ? existingStat?.memorizedCount || 0 : 0;
  const prevReviewLaterCount = isSameDay
    ? existingStat?.reviewLaterCount || 0
    : 0;

  const newMemorizedCount =
    action === "memorized" ? prevMemorizedCount + 1 : prevMemorizedCount;
  const newReviewLaterCount =
    action === "reviewLater" ? prevReviewLaterCount + 1 : prevReviewLaterCount;
  const newSwipedCount = newMemorizedCount + newReviewLaterCount;

  await Progress.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        dailyStat: {
          date: today,
          swipedCount: newSwipedCount,
          memorizedCount: newMemorizedCount,
          reviewLaterCount: newReviewLaterCount,
          remainingGoal: Math.max(0, dailyGoal - newSwipedCount),
          isGoalNotified: isSameDay ? (existingStat?.isGoalNotified || newSwipedCount >= dailyGoal) : (newSwipedCount >= dailyGoal),
        },
      },
    },
  );

  const io = getIo();

  // ── Goal Achieved Notification ──
  const goalAlreadyNotified = isSameDay && existingStat?.isGoalNotified;
  if (newSwipedCount >= dailyGoal && dailyGoal > 0 && !goalAlreadyNotified) {
    const title = "Goal Achieved! 🏆";
    const description = `Congratulations! You've achieved your daily goal of ${dailyGoal} words.`;
    
    // Update the flag in DB so it doesn't trigger again today
    await Progress.findOneAndUpdate(
      { user: userId },
      { $set: { "dailyStat.isGoalNotified": true } }
    );

    const notif = await NotificationModel.create({
      receiverId: userId.toString(),
      title,
      description,
      type: NotificationType.GOAL,
      status: NotificationStatus.UNREAD,
    });

    // Support both multi-event and generic listeners
    io.to(userId.toString()).emit("goal:achieved", {
      message: title,
      description,
      dailyGoal,
    });
    io.to(userId.toString()).emit("notification:new", notif);
  }

  // ── Review Words Notification (Every 15 words) ──
  const reviewCount = progress.reviewLater.length;
  if (reviewCount > 0 && reviewCount % 15 === 0 && action === "reviewLater") {
    const title = "Review Words Accumulated";
    const description = `${reviewCount} review words accumulated. Check now.`;

    const notif = await NotificationModel.create({
      receiverId: userId.toString(),
      title,
      description,
      type: NotificationType.REVIEW,
      status: NotificationStatus.UNREAD,
    });

    io.to(userId.toString()).emit("review:accumulated", {
      message: title,
      description,
      count: reviewCount,
    });
    io.to(userId.toString()).emit("newNotification", notif);
  }

  if (action !== "memorized") {
    return { progress, shouldShowVideo: false };
  }

  const lastAction = progress.lastActionDate
    ? new Date(progress.lastActionDate)
    : null;
  if (lastAction) lastAction.setHours(0, 0, 0, 0);

  const isConsecutiveDay =
    lastAction &&
    today.getTime() - lastAction.getTime() === 24 * 60 * 60 * 1000;

  const newScore = (progress.score || 0) + 1;
  const newStreak = isConsecutiveDay ? (progress.streak || 0) + 1 : 1;

  const shouldShowVideo = newScore % 10 === 0;

  progress = await Progress.findOneAndUpdate(
    { user: userId },
    {
      score: newScore,
      streak: newStreak,
      lastActionDate: new Date(),
      nextVideoAt: shouldShowVideo,
    },

    // Hello changes

    { new: true },
  );

  return { progress, shouldShowVideo };
};

export const getActiveSessionService = async (userId: Types.ObjectId) => {
  const session = await Learning.findOne({ user: userId, isActive: true });
  if (!session) throw new CustomError(404, "No active session found");
  return session;
};
