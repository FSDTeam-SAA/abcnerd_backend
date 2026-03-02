import { z } from "zod";
//: customize as needed
export const createLearningSchema = z.object({
  title: z.string().min(3).max(50).transform(val => val.trim()),
  description: z.string().max(500).optional().transform(val => val?.trim()),
});
