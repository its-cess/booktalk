"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addShelfItemSchema = exports.updateShelfSchema = exports.createShelfSchema = exports.WANT_TO_READ = void 0;
const zod_1 = require("zod");
/** Name of the auto-created, non-deletable system shelf. */
exports.WANT_TO_READ = "Want to Read";
exports.createShelfSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Shelf name is required")
        .max(50, "Shelf name is too long"),
    isPrivate: zod_1.z.boolean().optional(),
});
exports.updateShelfSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Shelf name is required").max(50, "Shelf name is too long").optional(),
    isPrivate: zod_1.z.boolean().optional(),
});
exports.addShelfItemSchema = zod_1.z.object({
    bookId: zod_1.z.string().min(1, "bookId is required"),
});
