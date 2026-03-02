// chatbot.validation.ts
import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").transform((v) => v.trim()),
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