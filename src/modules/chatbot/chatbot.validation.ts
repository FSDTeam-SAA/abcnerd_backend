import { z } from "zod";

export const createChatbotSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title must be at most 50 characters")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .transform((val) => val?.trim()),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateChatbotSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title must be at most 50 characters")
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .transform((val) => val?.trim()),
  status: z.enum(["active", "inactive"]).optional(),
});

export const chatbotQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .transform((val) => val.trim()),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .optional()
    .default([]),
});

export const generateDescSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .transform((val) => val.trim()),
});