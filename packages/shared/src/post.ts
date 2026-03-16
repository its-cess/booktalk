import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(1000, "Post is too long"),
  bookTitle: z.string().optional(),
  bookAuthor: z.string().optional(),
  hasSpoilers: z.boolean().default(false),
});

export type CreatePostData = z.infer<typeof createPostSchema>;

export interface PostWithAuthor {
  id: string;
  content: string;
  bookTitle: string | null;
  bookAuthor: string | null;
  hasSpoilers: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
}
