import { z } from "zod";

export const FEEDBACK_TYPES = ["bug", "feature", "other"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug",
  feature: "Feature request",
  other: "Other",
};

export const feedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  message: z
    .string()
    .trim()
    .min(1, "Please enter a message")
    .max(2000, "Message is too long"),
  // Current page URL, captured client-side for context (optional).
  url: z.string().max(500).optional(),
});

export type FeedbackData = z.infer<typeof feedbackSchema>;
