"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackSchema = exports.FEEDBACK_TYPE_LABELS = exports.FEEDBACK_TYPES = void 0;
const zod_1 = require("zod");
exports.FEEDBACK_TYPES = ["bug", "feature", "other"];
exports.FEEDBACK_TYPE_LABELS = {
    bug: "Bug",
    feature: "Feature request",
    other: "Other",
};
exports.feedbackSchema = zod_1.z.object({
    type: zod_1.z.enum(exports.FEEDBACK_TYPES),
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Please enter a message")
        .max(2000, "Message is too long"),
    // Current page URL, captured client-side for context (optional).
    url: zod_1.z.string().max(500).optional(),
});
