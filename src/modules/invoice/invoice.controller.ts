import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateInvoice } from "./invoice.interface";
import { invoiceService } from "./invoice.service";

//TODO: customize as needed
export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateInvoice = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const item = await invoiceService.createInvoice(data, image);
  ApiResponse.sendSuccess(res, 200, "Invoice created", item);
});
