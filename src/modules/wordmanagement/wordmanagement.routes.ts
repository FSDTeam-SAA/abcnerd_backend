import express from "express";
import { createWordmanagement, deleteWordmanagement, getAllWordmanagements, getWordmanagementById, updateWordmanagement } from "./wordmanagement.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createWordmanagementSchema, updateWordmanagementSchema } from "./wordmanagement.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-wordmanagement", uploadSingle("image"), validateRequest(createWordmanagementSchema), createWordmanagement);
router.post("/create-wordmanagement", authGuard, permission(["admin"]), validateRequest(createWordmanagementSchema), createWordmanagement);
router.get("/get-all-wordmanagement", authGuard, permission(["admin", "user"]), getAllWordmanagements);
router.get("/get-single-wordmanagement/:wordmanagementId", authGuard, permission(["admin", "user"]), getWordmanagementById);
router.patch("/update-wordmanagement/:wordmanagementId", authGuard, permission(["admin"]), validateRequest(updateWordmanagementSchema), updateWordmanagement);
router.delete("/delete-wordmanagement/:wordmanagementId", authGuard, permission(["admin"]), deleteWordmanagement);

export const wordmanagementRoute = router;
