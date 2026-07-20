import { z } from "zod";

export const MAX_TOP_BOOKS = 8;

export const setTopBooksSchema = z.object({
  // Ordered list of book IDs (position = array index). Capped at 8.
  bookIds: z.array(z.string()).max(MAX_TOP_BOOKS),
});

export type SetTopBooksData = z.infer<typeof setTopBooksSchema>;

export interface TopBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
}
