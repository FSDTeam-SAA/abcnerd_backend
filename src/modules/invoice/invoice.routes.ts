import express from "express";
import { createInvoice, deleteInvoice, getMyInvoices, getSingleInvoice } from "./invoice.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createInvoiceSchema } from "./invoice.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-invoice", uploadSingle("image"), validateRequest(createInvoiceSchema), createInvoice);
router.get("/get-single-invoice/:invoiceId", getSingleInvoice);
router.get("/get-all-invoices", getMyInvoices);
router.delete("/delete-invoice/:invoiceId", deleteInvoice);

export const invoiceRoute = router;
