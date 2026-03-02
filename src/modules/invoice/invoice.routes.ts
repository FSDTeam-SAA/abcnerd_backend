import express from "express";
import { createInvoice, deleteInvoice, getMyInvoices, getSingleInvoice } from "./invoice.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createInvoiceSchema } from "./invoice.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

//: customize as needed

//router.post("/create-invoice", uploadSingle("image"), validateRequest(createInvoiceSchema), createInvoice);
router.get("/get-single-invoice/:invoiceId", authGuard, getSingleInvoice);
router.get("/get-all-invoices", authGuard, getMyInvoices);
router.delete("/delete-invoice/:invoiceId", authGuard, deleteInvoice);

export const invoiceRoute = router;
