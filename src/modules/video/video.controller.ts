import { Request, Response, NextFunction } from "express";
import {
  createVideoService,
  getCategoryVideosService,
  updateVideoService,
  deleteVideoService,
} from "./video.service";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

// upload video
export const createVideo = asyncHandler(async (req: Request, res: Response) => {
  const filePath = req.file?.path;

  if (!filePath) {
    throw new Error("Video file is required");
  }

  const video = await createVideoService(req.body, filePath);
  console.log("response from service");

  ApiResponse.sendSuccess(res, 201, "Video uploaded successfully", video);
});

export const getCategoryVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const videos = await getCategoryVideosService(categoryId as string);

    ApiResponse.sendSuccess(res, 200, "Videos fetched successfully", videos);
  },
);

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new Error("Video ID not found in params");
  }

  const video = await updateVideoService(videoId as string, req.body);

  ApiResponse.sendSuccess(res, 200, "Video updated successfully", video);
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new Error("Video ID not found in params");
  }

  const result = await deleteVideoService(videoId as string);

  ApiResponse.sendSuccess(
    res,
    200,
    result?.message || "Video deleted successfully",
  );
});
