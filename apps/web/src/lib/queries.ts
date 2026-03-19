import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  PostWithAuthor,
  CreatePostData,
  UserProfile,
  UpdateProfileData,
  CommentWithAuthor,
  UserSummary,
  BookResult,
} from "@booktalk/shared";

export const FEED_KEY = ["posts", "feed"] as const;

export function useBookSearch(query: string) {
  return useQuery({
    queryKey: ["books", "search", query],
    queryFn: async () => {
      const res = await api.get<{ books: BookResult[] }>(
        `/books/search?q=${encodeURIComponent(query)}`
      );
      return res.data.books;
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeed() {
  return useQuery({
    queryKey: FEED_KEY,
    queryFn: async () => {
      const res = await api.get<{ posts: PostWithAuthor[] }>("/posts");
      return res.data.posts;
    },
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const res = await api.get<{ post: PostWithAuthor }>(`/posts/${id}`);
      return res.data.post;
    },
    enabled: !!id,
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      content,
      clearBook,
      bookId,
      bookTitle,
      bookAuthor,
    }: {
      postId: string;
      content: string;
      authorUsername: string;
      clearBook?: boolean;
      bookId?: string;
      bookTitle?: string;
      bookAuthor?: string;
    }) => {
      const res = await api.patch<{ post: PostWithAuthor }>(`/posts/${postId}`, {
        content,
        ...(clearBook && { clearBook: true }),
        ...(bookId && { bookId }),
        ...(bookTitle && !bookId && { bookTitle, bookAuthor }),
      });
      return res.data.post;
    },
    onSuccess: (post, { authorUsername }) => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: ["posts", post.id] });
      queryClient.invalidateQueries({ queryKey: ["users", authorUsername] });
    },
  });
}

export function useToggleCommentsDisabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      commentsDisabled,
    }: {
      postId: string;
      commentsDisabled: boolean;
    }) => {
      const res = await api.patch<{ post: PostWithAuthor }>(`/posts/${postId}`, {
        commentsDisabled,
      });
      return res.data.post;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: ["posts", post.id] });
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

export function useTogglePostLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string; authorUsername: string }) => {
      const res = await api.post<{ isLiked: boolean }>(`/posts/${postId}/like`);
      return { postId, isLiked: res.data.isLiked };
    },
    onSuccess: ({ postId }, { authorUsername }) => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["users", authorUsername] });
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

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  return useMutation({
    mutationFn: async (targetUsername: string) => {
      const res = await api.post<{ isFollowing: boolean }>(`/users/${targetUsername}/follow`);
      return { targetUsername, isFollowing: res.data.isFollowing };
    },
    onSuccess: ({ targetUsername }) => {
      queryClient.invalidateQueries({ queryKey: ["users", targetUsername] });
      if (me?.username) {
        queryClient.invalidateQueries({ queryKey: ["users", me.username] });
        queryClient.invalidateQueries({ queryKey: ["users", me.username, "following"] });
      }
    },
  });
}

export function useFollowList(username: string, type: "followers" | "following") {
  return useQuery({
    queryKey: ["users", username, type],
    queryFn: async () => {
      const res = await api.get<{ users: UserSummary[] }>(`/users/${username}/${type}`);
      return res.data.users;
    },
    enabled: !!username,
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

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await api.get<{ comments: CommentWithAuthor[] }>(`/posts/${postId}/comments`);
      return res.data.comments;
    },
    enabled: !!postId,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post<{ comment: CommentWithAuthor }>(`/posts/${postId}/comments`, {
        content,
      });
      return res.data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
}

export function useUpdateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const res = await api.patch<{ comment: CommentWithAuthor }>(`/comments/${commentId}`, {
        content,
      });
      return res.data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
}

export function useToggleCommentLike(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await api.post<{ isLiked: boolean }>(`/comments/${commentId}/like`);
      return { commentId, isLiked: res.data.isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}
