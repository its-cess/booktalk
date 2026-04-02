import { z } from "zod";

/** Request body for POST /auth/signup. API accepts these four fields only. */
export const signupRequestSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string().min(1, "Display name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** Full signup form schema (includes confirmPassword + match refinement). */
export const signupSchema = signupRequestSchema
  .extend({
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(8, "Password is required"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
