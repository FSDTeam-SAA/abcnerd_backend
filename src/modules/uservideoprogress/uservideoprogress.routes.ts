import { Router } from "express";
import {
  getNextVideo,
  getUserCategoryProgress,
  markVideoComplete,
  skipVideo,
} from "./uservideoprogress.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

// called every 10 words in session
router.get("/next/:categoryId", authGuard, permission(["user"]), getNextVideo);

// User watched a video
router.patch(
  "/:videoId/complete",
  authGuard,
  permission(["user"]),
  markVideoComplete,
);

// User skipped a video
router.patch("/:videoId/skip", authGuard, permission(["user"]), skipVideo);

// progress of all category videos (dashboard)
router.get(
  "/progress/:categoryId",
  authGuard,
  permission(["user"]),
  getUserCategoryProgress,
);

export const UserVideoProgressRoutes = router;
