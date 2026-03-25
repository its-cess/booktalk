import { z } from "zod";
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    displayName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const postSchema: z.ZodObject<{
    id: z.ZodString;
    authorId: z.ZodString;
    content: z.ZodString;
    bookTitle: z.ZodOptional<z.ZodString>;
    bookAuthor: z.ZodOptional<z.ZodString>;
    hasSpoilers: z.ZodBoolean;
    createdAt: z.ZodDate;
}, z.core.$strip>;
