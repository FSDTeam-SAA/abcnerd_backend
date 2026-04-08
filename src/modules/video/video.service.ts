import { IVideoCreate, IVideoUpdate } from "./video.interface";
import { uploadCloudinary, deleteCloudinary } from "../../helpers/cloudinary";
import CustomError from "../../helpers/CustomError";
import { VideoModel } from "./video.models";

// Admin: create video by uploading
export const createVideoService = async (
  payload: IVideoCreate,
  filePath: string,
) => {
  const { title, categoryId } = payload;

  // find the last order
  const lastVideo = await VideoModel.findOne({ category: categoryId })
    .sort({ order: -1 })
    .select("order");

  const nextOrder = lastVideo ? lastVideo.order + 1 : 1;

  const video = await VideoModel.create({
    title,
    category: categoryId,
    order: nextOrder, // automatic
  });

  // background job
  uploadVideo(filePath, video._id.toString());

  return video;
};

const uploadVideo = async (filePath: string, videoId: string) => {
  const { public_id, secure_url } = await uploadCloudinary(filePath, "video");
  if (!public_id || !secure_url) {
    await VideoModel.findByIdAndDelete(videoId);
    throw new CustomError(500, "Failed to upload video");
  }

  await VideoModel.findByIdAndUpdate(videoId, {
    cloudinaryPublicId: public_id,
    cloudinaryUrl: secure_url,
  });
};

// Admin: view all videos in the category
export const getCategoryVideosService = async (categoryId: string) => {
  return await VideoModel.find({ category: categoryId, isActive: true }).sort({
    order: 1,
  });
};

// Admin: video update (title, order, isActive)
export const updateVideoService = async (
  videoId: string,
  payload: IVideoUpdate,
) => {
  const video = await VideoModel.findByIdAndUpdate(videoId, payload, {
    new: true,
    runValidators: true,
  });

  if (!video) {
    throw new CustomError(404, "Video not found");
  }

  return video;
};

// Admin: video delete (cloudinary + db)
export const deleteVideoService = async (videoId: string) => {
  const video = await VideoModel.findById(videoId);

  if (!video) {
    throw new CustomError(404, "Video not found");
  }

  await deleteCloudinary(video.cloudinaryPublicId, "video");
  await VideoModel.findByIdAndDelete(videoId);

  return { message: "Video deleted successfully" };
};
