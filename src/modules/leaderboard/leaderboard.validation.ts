import { z } from "zod";
//TODO: customize as needed
export const createLeaderboardSchema = z.object({
  title: z.string().min(3).max(50).transform(val => val.trim()),
  description: z.string().max(500).optional().transform(val => val?.trim()),
});

export const leaderboardQuerySchema = z.object({
  filter: z.enum(["Day", "Week", "Month", "Year"], {
    message: "filter accepeted values are: Day, Week, Month, Year",
  }).optional(),
});
