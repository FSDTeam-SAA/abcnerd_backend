import { Router } from "express";
import {
  createVideo,
  getCategoryVideos,
  updateVideo,
  deleteVideo,
} from "./video.controller";
import { uploadVideoSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

// Admin routes
router.post(
  "/",
  authGuard,
  permission(["admin"]),
  uploadVideoSingle("video"),
  createVideo,
);

router.get(
  "/category/:categoryId",
  authGuard,
  permission(["admin"]),
  getCategoryVideos,
);

router.patch("/:videoId", authGuard, permission(["admin"]), updateVideo);

router.delete("/:videoId", authGuard, permission(["admin"]), deleteVideo);

export const VideoRoutes = router;
