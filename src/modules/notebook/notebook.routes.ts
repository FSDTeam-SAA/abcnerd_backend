import express from "express";
import { createNoteBook } from "./notebook.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createNoteBookSchema } from "./notebook.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-notebook", uploadSingle("image"), validateRequest(createNoteBookSchema), createNoteBook);

export default router;
