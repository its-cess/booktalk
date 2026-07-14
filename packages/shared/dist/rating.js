"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookRatingSchema = void 0;
const zod_1 = require("zod");
/**
 * A book rating is EITHER a star value (0–5 in 0.5 steps) OR "did not finish".
 * The two are mutually exclusive: when `dnf` is true, `rating` must be null.
 * `rating` is a decimal 0–5 in the API contract; the DB stores it as
 * half-stars (0–10) internally.
 */
exports.bookRatingSchema = zod_1.z
    .object({
    rating: zod_1.z.number().min(0).max(5).multipleOf(0.5).nullable(),
    dnf: zod_1.z.boolean().default(false),
})
    .refine((d) => (d.dnf ? d.rating === null : d.rating !== null), {
    message: "Provide a star rating (0–5) or mark it DNF, not both",
    path: ["rating"],
});
