import { z } from "zod";

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    displayName: z.string().min(1, "Display name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
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

/** Request body for POST /auth/signup (no confirmPassword) */
export const signupRequestSchema = signupSchema.omit({
  confirmPassword: true,
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
