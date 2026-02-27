import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateInvoice } from "./invoice.interface";
import { invoiceService } from "./invoice.service";

//TODO: customize as needed
export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateInvoice = req.body;
  const item = await invoiceService.createInvoice(data);
  ApiResponse.sendSuccess(res, 200, "Invoice created", item);
});

//Todo: get single invoice, only own invoice can be fetched
export const getSingleInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = req.params.invoiceId as string;
  if (!invoiceId) throw new Error("InvoiceId not found");
  const item = await invoiceService.getInvoice(invoiceId, (req as any).user._id as string);
  ApiResponse.sendSuccess(res, 200, "Invoice fetched", item);
});

//Todo: get my all invoices user and admin
export const getMyInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { invoices, meta } = await invoiceService.getAllInvoices(req);
  ApiResponse.sendSuccess(res, 200, "Invoices fetched", invoices, meta);
});

//Todo: delete invoice, only own invoice can be deleted
export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = req.params.invoiceId as string;
  if (!invoiceId) throw new Error("InvoiceId not found");
  await invoiceService.deleteInvoice(invoiceId, (req as any).user._id as string);
  ApiResponse.sendSuccess(res, 200, "Invoice deleted");
});


