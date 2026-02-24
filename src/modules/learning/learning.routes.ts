import { Router } from "express";
import { fetchLearningController } from "./learning.controller";

const router = Router();

router.post("/fetch", fetchLearningController);

export default router;
