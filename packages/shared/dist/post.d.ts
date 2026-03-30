import { z } from "zod";
export declare const createPostSchema: z.ZodObject<{
    content: z.ZodString;
    bookId: z.ZodOptional<z.ZodString>;
    bookTitle: z.ZodOptional<z.ZodString>;
    bookAuthor: z.ZodOptional<z.ZodString>;
    hasSpoilers: z.ZodDefault<z.ZodBoolean>;
    gifUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePostData = z.infer<typeof createPostSchema>;
export type CreatePostInput = z.input<typeof createPostSchema>;
export declare const updatePostSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    hasSpoilers: z.ZodOptional<z.ZodBoolean>;
    commentsDisabled: z.ZodOptional<z.ZodBoolean>;
    clearBook: z.ZodOptional<z.ZodBoolean>;
    bookId: z.ZodOptional<z.ZodString>;
    bookTitle: z.ZodOptional<z.ZodString>;
    bookAuthor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    gifUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export declare const updateCommentSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strip>;
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
