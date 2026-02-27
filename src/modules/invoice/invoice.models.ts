import { Schema, model, Types } from "mongoose";
import slugify from "slugify";
import { IInvoice, InvoiceStatus } from "./invoice.interface";

const InvoiceSchema = new Schema<IInvoice>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },

    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },

    planName: { type: String, required: true, trim: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },

    status: {
      type: String,
      enum: ["paid", "pending", "failed", "refunded", "void"] as InvoiceStatus[],
      default: "paid",
      index: true,
    },

    isDeleted: { type: Boolean, default: false, index: true },

    slug: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

// slug auto-generate
InvoiceSchema.pre("validate", async function (next) {
  if (!this.isModified("title") && this.slug) return;

  const base = slugify(this.title || "invoice", { lower: true, strict: true });
  let slug = base || "invoice";

  const InvoiceModel = model<IInvoice>("Invoice");
  let counter = 0;

  while (await InvoiceModel.exists({ slug, _id: { $ne: this._id } })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  this.slug = slug;
});

export const InvoiceModel = model<IInvoice>("Invoice", InvoiceSchema);