"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.signupSchema = exports.signupRequestSchema = void 0;
const zod_1 = require("zod");
/** Request body for POST /auth/signup. API accepts these four fields only. */
exports.signupRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    username: zod_1.z.string().min(3, "Username must be at least 3 characters"),
    displayName: zod_1.z.string().min(1, "Display name is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
/** Full signup form schema (includes confirmPassword + match refinement). */
exports.signupSchema = exports.signupRequestSchema
    .extend({
    confirmPassword: zod_1.z.string().min(8),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, "Email or username is required"),
    password: zod_1.z.string().min(8, "Password is required"),
});
