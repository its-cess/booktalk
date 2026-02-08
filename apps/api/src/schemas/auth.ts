import { z } from "zod";

export const signupSchema = z
  .object({
    email: z.email(),
    username: z.string().min(3, "Username must be at least 3 characters"),
    displayName: z.string().min(1, "Display Name is required"),
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
