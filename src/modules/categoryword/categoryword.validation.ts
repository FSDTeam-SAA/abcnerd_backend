import { z } from "zod";
//TODO: customize as needed

export const createCategoryWordSchema = z.object({
  name: z.string()
    .max(100)
    .transform(val => val.trim())
    .refine(val => val.length > 0, { message: "Name cannot be empty" }),
  description: z
    .string()
    .max(500)
    .optional()
    .transform(val => val?.trim()),
  isActive: z.boolean().optional()
})
  .strict();


export const updateCategoryWordSchema = z.object({
  name: z.string()
    .max(100)
    .optional()
    .transform(val => val?.trim()),
  description: z
    .string()
    .max(500)
    .optional()
    .transform(val => val?.trim()),
  isActive: z.boolean().optional()
})
  .strict();

