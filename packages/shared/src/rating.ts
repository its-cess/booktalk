import { z } from "zod";

/**
 * A book rating is EITHER a star value (0–5 in 0.5 steps) OR "did not finish".
 * The two are mutually exclusive: when `dnf` is true, `rating` must be null.
 * `rating` is a decimal 0–5 in the API contract; the DB stores it as
 * half-stars (0–10) internally.
 */
export const bookRatingSchema = z
  .object({
    rating: z.number().min(0).max(5).multipleOf(0.5).nullable(),
    dnf: z.boolean().default(false),
  })
  .refine((d) => (d.dnf ? d.rating === null : d.rating !== null), {
    message: "Provide a star rating (0–5) or mark it DNF, not both",
    path: ["rating"],
  });

export type BookRatingInput = z.input<typeof bookRatingSchema>;
export type BookRatingData = z.infer<typeof bookRatingSchema>;

/** The current user's own rating of a book (null when they haven't rated it). */
export interface MyBookRating {
  rating: number | null; // 0–5 in 0.5 steps; null when dnf or unrated
  dnf: boolean;
}
