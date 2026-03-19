import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(1000, "Post is too long"),
  bookTitle: z.string().optional(),
  bookAuthor: z.string().optional(),
  hasSpoilers: z.boolean().default(false),
});

export type CreatePostData = z.infer<typeof createPostSchema>;
export type CreatePostInput = z.input<typeof createPostSchema>;

export const updatePostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(1000, "Post is too long").optional(),
  commentsDisabled: z.boolean().optional(),
});

export type UpdatePostData = z.infer<typeof updatePostSchema>;

export interface PostWithAuthor {
  id: string;
  content: string;
  bookTitle: string | null;
  bookAuthor: string | null;
  hasSpoilers: boolean;
  commentsDisabled: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

export type CreateCommentData = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

export type UpdateCommentData = z.infer<typeof updateCommentSchema>;

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
  likeCount: number;
  isLiked: boolean;
}
