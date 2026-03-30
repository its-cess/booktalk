import { z } from "zod";
import type { PostWithAuthor } from "./post";
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export declare const updateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    posts: PostWithAuthor[];
}
export interface UserSummary {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isFollowing: boolean;
}
