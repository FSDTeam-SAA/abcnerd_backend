import { Document, Types } from "mongoose";

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded" | "void";

export interface IInvoice extends Document {
  title: string;
  description: string;

  userId: Types.ObjectId;
  email: string;

  planName: string;
  startDate: Date;
  endDate: Date;

  status: InvoiceStatus;
  isDeleted: boolean;
  slug: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateInvoice {
  title: string;
  description?: string;

  userId: string;
  email: string;

  planName: string;
  startDate: Date;
  endDate: Date;

  status?: InvoiceStatus;
}