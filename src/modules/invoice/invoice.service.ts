import { InvoiceModel } from "./invoice.models";
import { ICreateInvoice } from "./invoice.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import mongoose from "mongoose";

//TODO: customize as needed

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

export const getInvoices = async (query: {
  search?: string;
  status?: string;
  page?: string | number;
  limit?: string | number;
}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;

  const filter: any = { isDeleted: false };

  if (query.status) {
    const s = String(query.status).trim() as InvoiceStatus;
    if (!allowedStatus.includes(s)) {
      throw new CustomError(400, `Invalid status. Allowed: ${allowedStatus.join(", ")}`);
    }
    filter.status = s;
  }

  if (query.search) {
    const s = String(query.search).trim();
    filter.$or = [
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { slug: { $regex: s, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    InvoiceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    InvoiceModel.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

export const getInvoiceById = async (invoiceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new CustomError(400, "Invalid invoiceId");
  }

  const invoice = await InvoiceModel.findOne({
    _id: invoiceId,
    isDeleted: false,
  }).lean();

  if (!invoice) throw new CustomError(404, "Invoice not found");
  return invoice;
};

export const updateInvoice = async (
  invoiceId: string,
  payload: Partial<ICreateInvoice>
) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new CustomError(400, "Invalid invoiceId");
  }

  const update: any = {};

  if (payload.title !== undefined) {
    const t = String(payload.title || "").trim();
    if (!t) throw new CustomError(400, "Title cannot be empty");
    update.title = t;
  }

  if (payload.description !== undefined) {
    update.description = String(payload.description || "").trim();
  }

  if (payload.status !== undefined) {
    const s = String(payload.status).trim() as InvoiceStatus;
    if (!allowedStatus.includes(s)) {
      throw new CustomError(400, `Invalid status. Allowed: ${allowedStatus.join(", ")}`);
    }
    update.status = s;
  }

  const invoice = await InvoiceModel.findOneAndUpdate(
    { _id: invoiceId, isDeleted: false },
    update,
    { new: true, runValidators: true }
  );

  if (!invoice) throw new CustomError(404, "Invoice not found");
  return invoice;
};

export const deleteInvoice = async (invoiceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new CustomError(400, "Invalid invoiceId");
  }

  const invoice = await InvoiceModel.findOneAndUpdate(
    { _id: invoiceId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!invoice) throw new CustomError(404, "Invoice not found");
  return invoice;
};

export const invoiceService = { createInvoice };
