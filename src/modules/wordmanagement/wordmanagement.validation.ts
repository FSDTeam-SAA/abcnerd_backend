import { z } from "zod";
import mongoose from "mongoose";

export const createWordmanagementSchema = z.object({
  word: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title cannot exceed 50 characters")
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .transform((val) => val?.trim()),

  status: z
    .enum(["active", "inactive"])
    .optional()
    .default("active"),

  synonyms: z
    .array(z.string().min(1).max(50))
    .optional(),

  categoryWordId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid categoryWordId, must be a valid ObjectId",
    }),
});