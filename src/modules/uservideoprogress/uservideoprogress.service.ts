import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { VideoModel } from "../video/video.models";
import { UserVideoProgressModel } from "./uservideoprogress.models";

// Find next video after session
export const getNextVideoService = async (
  userId: Types.ObjectId,
  categoryId: string,
) => {
  const now = new Date();

  const videos = await VideoModel.find({
    category: categoryId,
    isActive: true,
  }).sort({ order: 1 });

  // look for available videos
  for (const video of videos) {
    const progress = await UserVideoProgressModel.findOne({
      user: userId,
      video: video._id,
    });

    // not watched yet → return it
    if (!progress) return video;

    // completed → skip
    if (progress.status === "completed") continue;

    // skipped but availableAt not reached yet → skip
    if (progress.status === "skipped" && progress.availableAt > now) continue;

    // skipped but availableAt has passed → return it
    return video;
  }

  // all videos completed or in cooldown → reset progress
  await resetCategoryProgressService(userId, categoryId);

  // after reset, return the first video
  const firstVideo = videos[0];
  return firstVideo ?? null;
};

// User watched a video
export const markVideoCompleteService = async (
  userId: Types.ObjectId,
  videoId: string,
) => {
  console.log(`[VideoProgress] Marking video ${videoId} as complete for user ${userId}`);
  
  const video = await VideoModel.findById(videoId);
  if (!video) throw new CustomError(404, "Video not found");

  const progress = await UserVideoProgressModel.findOneAndUpdate(
    { user: userId, video: new Types.ObjectId(videoId) },
    {
      status: "completed",
      watchedAt: new Date(),
      availableAt: new Date(), // Required field in schema
    },
    { upsert: true, new: true },
  );

  return progress;
};

// User skipped a video
export const skipVideoService = async (
  userId: Types.ObjectId,
  videoId: string,
) => {
  const now = new Date();
  const existing = await UserVideoProgressModel.findOne({
    user: userId,
    video: videoId,
  });

  // first skip
  if (!existing) {
    return await UserVideoProgressModel.create({
      user: userId,
      video: videoId,
      status: "skipped",
      skipCount: 1,
      availableAt: now, // available now, next cycle will handle it
    });
  }

  if (existing.status === "completed") {
    throw new CustomError(400, "Video already completed");
  }

  existing.skipCount += 1;
  existing.status = "skipped";

  // skipped twice → available after 2 days
  if (existing.skipCount >= 2) {
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    existing.availableAt = twoDaysLater;
  }

  await existing.save();
  return existing;
};

// progress for all videos in a user's category
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

  // merge progress with videos
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

  // reset completed videos to pending, but keep watchCount and watchedAt
  await UserVideoProgressModel.updateMany(
    { user: userId, video: { $in: videoIds }, status: "completed" },
    {
      $set: {
        status: "pending",
        availableAt: new Date(), // available immediately
      },
      // do not update watchCount or watchedAt
    },
  );

  // reset skipped videos too
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
