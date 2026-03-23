import { z } from "zod";
import type { PostWithAuthor } from "./post";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty").max(64).optional(),
  bio: z.string().max(280, "Bio is too long").optional(),
  avatarUrl: z.string().url().optional(),
});

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
