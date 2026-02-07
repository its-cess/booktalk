import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(3),
  bio: z.string().optional(),
  profilePictureUrl: z.string().url().optional(),
});

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  content: z.string().min(1),
  bookTitle: z.string().optional(),
  bookAuthor: z.string().optional(),
  hasSpoilers: z.boolean(),
  createdAt: z.date(),
});
