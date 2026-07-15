"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTopBooksSchema = exports.MAX_TOP_BOOKS = void 0;
const zod_1 = require("zod");
exports.MAX_TOP_BOOKS = 8;
exports.setTopBooksSchema = zod_1.z.object({
    // Ordered list of book IDs (position = array index). Capped at 8.
    bookIds: zod_1.z.array(zod_1.z.string()).max(exports.MAX_TOP_BOOKS),
});
