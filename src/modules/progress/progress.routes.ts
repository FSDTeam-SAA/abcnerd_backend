import { Router } from "express";
import {
  getProgress,
  getProgressWords,
  getReviewLater,
  toggleFavorite,
} from "./progress.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.get("/progress-summary", authGuard, getProgress);
router.get("/words", authGuard, getProgressWords);
router.get("/review-later", authGuard, getReviewLater);

router.post("/toggle-favorite", authGuard, toggleFavorite);

const progressRoute = router;
export default progressRoute;
