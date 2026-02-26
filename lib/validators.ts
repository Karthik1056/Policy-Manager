import * as z from "zod";

export const policySchema = z.object({
  name: z.string().min(3, "Policy name must be at least 3 characters"),
  product: z.string().min(2, "Product category is required"),
  version: z.string().default("v1.0"),
  description: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MAKER", "CHECKER"]),
});

export type PolicyFormData = z.infer<typeof policySchema>;