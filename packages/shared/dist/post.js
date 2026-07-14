"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentSchema = exports.createCommentSchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Post cannot be empty").max(500, "Post is too long"),
    bookId: zod_1.z.string().optional(),
    bookTitle: zod_1.z.string().optional(),
    bookAuthor: zod_1.z.string().optional(),
    hasSpoilers: zod_1.z.boolean().default(false),
    gifUrl: zod_1.z.string().url().optional(),
    // Optional rating snapshot; only honored by the API when a real bookId is set.
    // rating is 0–5 in 0.5 steps (null = no star value), dnf marks "did not finish".
    rating: zod_1.z.number().min(0).max(5).multipleOf(0.5).nullable().optional(),
    dnf: zod_1.z.boolean().optional(),
});
exports.updatePostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Post cannot be empty").max(500, "Post is too long").optional(),
    hasSpoilers: zod_1.z.boolean().optional(),
    commentsDisabled: zod_1.z.boolean().optional(),
    clearBook: zod_1.z.boolean().optional(),
    bookId: zod_1.z.string().optional(),
    bookTitle: zod_1.z.string().optional(),
    bookAuthor: zod_1.z.string().optional(),
    rating: zod_1.z.number().min(0).max(5).multipleOf(0.5).nullable().optional(),
    dnf: zod_1.z.boolean().optional(),
});
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
    gifUrl: zod_1.z.string().url().optional(),
});
exports.updateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});
