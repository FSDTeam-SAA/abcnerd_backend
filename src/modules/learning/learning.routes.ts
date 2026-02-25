import { Router } from "express";
import {
  createLearningSession,
  fetchLearningWords,
  wordAction,
} from "./learning.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/create-session",
  authGuard,
  //   validateRequest(createLearningValidation),
  createLearningSession,
);

router.get("/fetch-words", authGuard, fetchLearningWords);

router.patch(
  "/word-action",
  authGuard,
  //   validateRequest(wordActionValidation),
  wordAction,
);

const learningRoute = router;
export default learningRoute;
