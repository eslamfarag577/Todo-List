import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200, "title too long"),
});

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });
