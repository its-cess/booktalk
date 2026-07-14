import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(500, "Post is too long"),
  bookId: z.string().optional(),
  bookTitle: z.string().optional(),
  bookAuthor: z.string().optional(),
  hasSpoilers: z.boolean().default(false),
  gifUrl: z.string().url().optional(),
  // Optional rating snapshot; only honored by the API when a real bookId is set.
  // rating is 0–5 in 0.5 steps (null = no star value), dnf marks "did not finish".
  rating: z.number().min(0).max(5).multipleOf(0.5).nullable().optional(),
  dnf: z.boolean().optional(),
});

export type CreatePostData = z.infer<typeof createPostSchema>;
export type CreatePostInput = z.input<typeof createPostSchema>;

export const updatePostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(500, "Post is too long").optional(),
  hasSpoilers: z.boolean().optional(),
  commentsDisabled: z.boolean().optional(),
  clearBook: z.boolean().optional(),
  bookId: z.string().optional(),
  bookTitle: z.string().optional(),
  bookAuthor: z.string().optional(),
  rating: z.number().min(0).max(5).multipleOf(0.5).nullable().optional(),
  dnf: z.boolean().optional(),
});

export type UpdatePostData = z.infer<typeof updatePostSchema>;

export interface BookResult {
  id: string;
  openLibraryKey: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
}

export interface PostWithAuthor {
  id: string;
  content: string;
  book: BookResult | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  hasSpoilers: boolean;
  commentsDisabled: boolean;
  gifUrl: string | null;
  // Rating snapshot shown on the post. rating is 0–5 (null when DNF or unrated);
  // dnf true means the author marked the book "did not finish".
  rating: number | null;
  dnf: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isFollowingAuthor?: boolean;
}

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
  gifUrl: z.string().url().optional(),
});

export type CreateCommentData = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

export type UpdateCommentData = z.infer<typeof updateCommentSchema>;

export interface CommentWithAuthor {
  id: string;
  content: string;
  gifUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  isLiked: boolean;
}
