"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    username: zod_1.z.string().min(3),
    displayName: zod_1.z.string().min(1),
    bio: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
exports.postSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    content: zod_1.z.string().min(1),
    bookTitle: zod_1.z.string().optional(),
    bookAuthor: zod_1.z.string().optional(),
    hasSpoilers: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
});
