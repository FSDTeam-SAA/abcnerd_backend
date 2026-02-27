import express from "express";
import { createInvoice } from "./invoice.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createInvoiceSchema } from "./invoice.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-invoice", uploadSingle("image"), validateRequest(createInvoiceSchema), createInvoice);

export default router;
