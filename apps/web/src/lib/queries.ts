import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PostWithAuthor, CreatePostData, UserProfile, UpdateProfileData } from "@booktalk/shared";

export const FEED_KEY = ["posts", "feed"] as const;

export function useFeed() {
  return useQuery({
    queryKey: FEED_KEY,
    queryFn: async () => {
      const res = await api.get<{ posts: PostWithAuthor[] }>("/posts");
      return res.data.posts;
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const res = await api.patch<{ post: PostWithAuthor }>(`/posts/${postId}`, { content });
      return res.data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
    },
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ["users", username],
    queryFn: async () => {
      const res = await api.get<{ user: UserProfile }>(`/users/${username}`);
      return res.data.user;
    },
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await api.patch<{ user: UserProfile }>("/users/me", data);
      return res.data.user;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users", user.username] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const res = await api.post<{ post: PostWithAuthor }>("/posts", data);
      return res.data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
    },
  });
}
