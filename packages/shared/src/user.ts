import { z } from "zod";
import type { PostWithAuthor } from "./post";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty").max(64).optional(),
  bio: z.string().max(280, "Bio is too long").optional(),
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
  posts: PostWithAuthor[];
}
