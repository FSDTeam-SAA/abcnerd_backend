import { Router } from "express";
import { getProgress, getProgressWords } from "./progress.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authGuard, getProgress);
router.get("/words", authGuard, getProgressWords);

const progressRoute = router;
export default progressRoute;
