import express from "express";
import { createQuizAttempt } from "./quizattempt.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createQuizAttemptSchema } from "./quizattempt.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-quizattempt", uploadSingle("image"), validateRequest(createQuizAttemptSchema), createQuizAttempt);

export default router;
