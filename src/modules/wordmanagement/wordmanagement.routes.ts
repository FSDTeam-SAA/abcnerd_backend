import express from "express";
import { createWordmanagement } from "./wordmanagement.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createWordmanagementSchema } from "./wordmanagement.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-wordmanagement", uploadSingle("image"), validateRequest(createWordmanagementSchema), createWordmanagement);
router.post("/create-wordmanagement", validateRequest(createWordmanagementSchema), createWordmanagement);

export const wordmanagementRoute = router;
