import { z } from "zod";
export declare const FEEDBACK_TYPES: readonly ["bug", "feature", "other"];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export declare const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string>;
export declare const feedbackSchema: z.ZodObject<{
    type: z.ZodEnum<{
        bug: "bug";
        feature: "feature";
        other: "other";
    }>;
    message: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FeedbackData = z.infer<typeof feedbackSchema>;
