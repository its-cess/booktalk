"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = void 0;
const zod_1 = require("zod");
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1, "Display name cannot be empty").max(64).optional(),
    bio: zod_1.z.string().max(280, "Bio is too long").optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
