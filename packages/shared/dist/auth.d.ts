import { z } from "zod";
/** Request body for POST /auth/signup. API accepts these four fields only. */
export declare const signupRequestSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    displayName: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
/** Full signup form schema (includes confirmPassword + match refinement). */
export declare const signupSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    displayName: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
