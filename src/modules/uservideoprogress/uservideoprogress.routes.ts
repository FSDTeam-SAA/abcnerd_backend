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

// Session এ প্রতি 10 word পর call হবে
router.get("/next/:categoryId", authGuard, permission(["user"]), getNextVideo);

// User video দেখল
router.patch(
  "/:videoId/complete",
  authGuard,
  permission(["user"]),
  markVideoComplete,
);

// User video skip করল
router.patch("/:videoId/skip", authGuard, permission(["user"]), skipVideo);

// Category র সব video র progress (dashboard)
router.get(
  "/progress/:categoryId",
  authGuard,
  permission(["user"]),
  getUserCategoryProgress,
);

export const UserVideoProgressRoutes = router;
