import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { VideoModel } from "../video/video.models";
import { UserVideoProgressModel } from "./uservideoprogress.models";

// Session শেষে পরবর্তী video খুঁজে দেওয়া
export const getNextVideoService = async (
  userId: Types.ObjectId,
  categoryId: string,
) => {
  const now = new Date();

  const videos = await VideoModel.find({
    category: categoryId,
    isActive: true,
  }).sort({ order: 1 });

  // available videos খোঁজো
  for (const video of videos) {
    const progress = await UserVideoProgressModel.findOne({
      user: userId,
      video: video._id,
    });

    // কখনো দেখা হয়নি → দাও
    if (!progress) return video;

    // completed → skip
    if (progress.status === "completed") continue;

    // skipped কিন্তু availableAt এখনো হয়নি → skip
    if (progress.status === "skipped" && progress.availableAt > now) continue;

    // skipped কিন্তু availableAt পার হয়েছে → দাও
    return video;
  }

  // সব video completed বা cooldown এ → reset করো
  await resetCategoryProgressService(userId, categoryId);

  // reset এর পর প্রথম video দাও
  const firstVideo = videos[0];
  return firstVideo ?? null;
};

// User video দেখল
export const markVideoCompleteService = async (
  userId: Types.ObjectId,
  videoId: string,
) => {
  const video = await VideoModel.findById(videoId);
  if (!video) throw new CustomError(404, "Video not found");

  const progress = await UserVideoProgressModel.findOneAndUpdate(
    { user: userId, video: videoId },
    {
      status: "completed",
      watchedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  return progress;
};

// User video skip করল
export const skipVideoService = async (
  userId: Types.ObjectId,
  videoId: string,
) => {
  const now = new Date();
  const existing = await UserVideoProgressModel.findOne({
    user: userId,
    video: videoId,
  });

  // প্রথমবার skip
  if (!existing) {
    return await UserVideoProgressModel.create({
      user: userId,
      video: videoId,
      status: "skipped",
      skipCount: 1,
      availableAt: now, // এখনই available, পরের cycle এ আসবে
    });
  }

  if (existing.status === "completed") {
    throw new CustomError(400, "Video already completed");
  }

  existing.skipCount += 1;
  existing.status = "skipped";

  // 2 বার skip → 2 দিন পর
  if (existing.skipCount >= 2) {
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    existing.availableAt = twoDaysLater;
  }

  await existing.save();
  return existing;
};

// User এর একটা category র সব video progress
export const getUserCategoryProgressService = async (
  userId: Types.ObjectId,
  categoryId: string,
) => {
  const videos = await VideoModel.find({
    category: categoryId,
    isActive: true,
  }).sort({ order: 1 });

  const progressList = await UserVideoProgressModel.find({
    user: userId,
    video: { $in: videos.map((v) => v._id) },
  });

  // video গুলোর সাথে progress merge করে দাও
  return videos.map((video) => {
    const progress = progressList.find(
      (p) => p.video.toString() === video._id.toString(),
    );
    return {
      video,
      status: progress?.status ?? "pending",
      skipCount: progress?.skipCount ?? 0,
      watchedAt: progress?.watchedAt ?? null,
    };
  });
};

export const resetCategoryProgressService = async (
  userId: Types.ObjectId,
  categoryId: string,
) => {
  const videos = await VideoModel.find({
    category: categoryId,
    isActive: true,
  });
  const videoIds = videos.map((v) => v._id);

  // completed গুলো reset → pending, কিন্তু watchCount ও watchedAt রাখো
  await UserVideoProgressModel.updateMany(
    { user: userId, video: { $in: videoIds }, status: "completed" },
    {
      $set: {
        status: "pending",
        availableAt: new Date(), // এখনই available
      },
      // watchCount ও watchedAt touch করছি না
    },
  );

  // skipped গুলোও reset
  await UserVideoProgressModel.updateMany(
    { user: userId, video: { $in: videoIds }, status: "skipped" },
    {
      $set: {
        status: "pending",
        skipCount: 0,
        availableAt: new Date(),
      },
    },
  );
};
