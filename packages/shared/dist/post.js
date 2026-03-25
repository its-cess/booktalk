"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentSchema = exports.createCommentSchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Post cannot be empty").max(1000, "Post is too long"),
    bookId: zod_1.z.string().optional(),
    bookTitle: zod_1.z.string().optional(),
    bookAuthor: zod_1.z.string().optional(),
    hasSpoilers: zod_1.z.boolean().default(false),
    gifUrl: zod_1.z.string().url().optional(),
});
exports.updatePostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Post cannot be empty").max(1000, "Post is too long").optional(),
    hasSpoilers: zod_1.z.boolean().optional(),
    commentsDisabled: zod_1.z.boolean().optional(),
    clearBook: zod_1.z.boolean().optional(),
    bookId: zod_1.z.string().optional(),
    bookTitle: zod_1.z.string().optional(),
    bookAuthor: zod_1.z.string().optional(),
});
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
    gifUrl: zod_1.z.string().url().optional(),
});
exports.updateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});
