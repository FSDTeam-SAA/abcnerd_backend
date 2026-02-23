import express from "express";
import { createCategoryWord, deleteCategoryWord, getAllCategoryWords, getCategoryWordById, updateCategoryWord } from "./categoryword.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createCategoryWordSchema, updateCategoryWordSchema } from "./categoryword.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = express.Router();



//router.post("/create-categoryword", uploadSingle("image"), validateRequest(createCategoryWordSchema), createCategoryWord);
router.post("/create-categoryword", authGuard, permission(["admin"]), validateRequest(createCategoryWordSchema), createCategoryWord);
router.get("/get-all-categorywords", authGuard, permission(["admin"]), getAllCategoryWords);
router.get("/get-single-categoryword/:categorywordId", authGuard, permission(["admin"]), getCategoryWordById);
router.patch("/update-categoryword/:categorywordId", authGuard, permission(["admin"]), validateRequest(updateCategoryWordSchema), updateCategoryWord);
router.delete("/delete-categoryword/:categorywordId", authGuard, permission(["admin"]), deleteCategoryWord);


export const categorywordRoute = router;
