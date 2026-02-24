import { Router } from "express";
import { updateProgressController } from "./progress.controller";

const router = Router();

router.post("/update", updateProgressController);

export default router;
