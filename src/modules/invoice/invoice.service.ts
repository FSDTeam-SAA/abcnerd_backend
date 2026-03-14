import { InvoiceModel } from "./invoice.models";
import { ICreateInvoice } from "./invoice.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import mongoose from "mongoose";
import { paginationHelper } from "../../utils/pagination";

//: customize as needed

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded" | "void";

export const allowedStatus: InvoiceStatus[] = ["paid", "pending", "failed", "refunded", "void"];

export const createInvoice = async (payload: ICreateInvoice) => {
  const title = String(payload.title || "").trim();
  if (!title) throw new CustomError(400, "Title is required");

  const description = String(payload.description || "").trim();

  const status = (payload.status || "pending") as InvoiceStatus;
  if (!allowedStatus.includes(status)) {
    throw new CustomError(400, `Invalid status. Allowed: ${allowedStatus.join(", ")}`);
  }

  const invoice = await InvoiceModel.create({
    title,
    description,
    status,
    isDeleted: false,
  });

  return invoice;
};

//: get single invoice, only own invoice can be fetched
const getInvoice = async (invoiceId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) throw new CustomError(400, "Invalid invoiceId");

  const invoice = await InvoiceModel.findOne({ _id: invoiceId, userId, isDeleted: false });
  if (!invoice) throw new CustomError(404, "Invoice not found");

  return invoice;
};

//: get my all invoices user and admin
const getAllInvoices = async (req: any) => {
  const { page: pageQuery, limit: limitQuery } = req.query;
  const { _id: userId } = req.user;

  // pagination helper
  const { page, limit, skip } = paginationHelper(pageQuery, limitQuery);

  const filter = {
    userId: String(userId),
    isDeleted: false,
  };

  const invoices = await InvoiceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

  const total = await InvoiceModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    invoices,
    meta: {
      page,
      limit,
      totalPages,
      total,
    },
  };
};

//: delete invoice, only own invoice can be deleted
const deleteInvoice = async (invoiceId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) throw new CustomError(400, "Invalid invoiceId");

  const invoice = await InvoiceModel.findOne({ _id: invoiceId, userId, isDeleted: false });
  if (!invoice) throw new CustomError(404, "Invoice not found");

  invoice.isDeleted = true;
  await invoice.save();
};

export const invoiceService = { createInvoice, getInvoice, getAllInvoices, deleteInvoice };
