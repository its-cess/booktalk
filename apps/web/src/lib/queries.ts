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
  GroupedNotification,
  MyBookRating,
  ShelfSummary,
  ShelfWithBooks,
  ShelfMembership,
  CreateShelfData,
  FeedbackData,
  TopBook,
} from "@booktalk/shared";

interface BookDetailResponse {
  book: BookResult;
  posts: PostWithAuthor[];
  myRating: MyBookRating | null;
  averageRating: number | null;
  ratingCount: number;
}

export const FEED_KEY = ["posts", "feed"] as const;

export function useBookDetail(id: string) {
  return useQuery({
    queryKey: ["books", id],
    queryFn: async () => {
      const res = await api.get<BookDetailResponse>(`/books/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Ratings are shown live on posts too, so refresh the surfaces that render them.
function invalidateRatingSurfaces(queryClient: ReturnType<typeof useQueryClient>, bookId: string, myUsername?: string) {
  queryClient.invalidateQueries({ queryKey: ["books", bookId] });
  queryClient.invalidateQueries({ queryKey: FEED_KEY });
  queryClient.invalidateQueries({ queryKey: TRENDING_KEY });
  if (myUsername) queryClient.invalidateQueries({ queryKey: ["users", myUsername] });
}

export function useRateBook(bookId: string) {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  return useMutation({
    mutationFn: async ({ rating, dnf }: { rating: number | null; dnf: boolean }) => {
      const res = await api.put<{ myRating: MyBookRating }>(`/books/${bookId}/rating`, {
        rating,
        dnf,
      });
      return res.data.myRating;
    },
    onSuccess: () => invalidateRatingSurfaces(queryClient, bookId, me?.username),
  });
}

export function useRemoveRating(bookId: string) {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/books/${bookId}/rating`);
    },
    onSuccess: () => invalidateRatingSurfaces(queryClient, bookId, me?.username),
  });
}

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

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      const res = await api.get<{ users: { id: string; username: string; displayName: string | null; avatarUrl: string | null }[] }>(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      return res.data.users;
    },
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useSearchPosts(query: string) {
  return useQuery({
    queryKey: ["posts", "search", query],
    queryFn: async () => {
      const res = await api.get<{ posts: PostWithAuthor[] }>(
        `/posts/search?q=${encodeURIComponent(query)}`
      );
      return res.data.posts;
    },
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
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

export const TRENDING_KEY = ["posts", "trending"] as const;

export function useTrendingFeed(enabled: boolean) {
  return useQuery({
    queryKey: TRENDING_KEY,
    queryFn: async () => {
      const res = await api.get<{ posts: PostWithAuthor[] }>("/posts/trending");
      return res.data.posts;
    },
    enabled,
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
      hasSpoilers,
      clearBook,
      bookId,
      bookTitle,
      bookAuthor,
      rating,
      dnf,
    }: {
      postId: string;
      content: string;
      authorUsername: string;
      hasSpoilers?: boolean;
      clearBook?: boolean;
      bookId?: string;
      bookTitle?: string;
      bookAuthor?: string;
      rating?: number | null;
      dnf?: boolean;
    }) => {
      const res = await api.patch<{ post: PostWithAuthor }>(`/posts/${postId}`, {
        content,
        ...(hasSpoilers !== undefined && { hasSpoilers }),
        ...(clearBook && { clearBook: true }),
        ...(bookId && { bookId }),
        ...(bookTitle && !bookId && { bookTitle, bookAuthor }),
        ...(rating !== undefined && { rating }),
        ...(dnf !== undefined && { dnf }),
      });
      return res.data.post;
    },
    onSuccess: (post, { authorUsername }) => {
      const updatePosts = (posts: PostWithAuthor[] | undefined) =>
        posts?.map((p) => (p.id === post.id ? { ...p, ...post } : p));
      queryClient.setQueryData<PostWithAuthor[]>(FEED_KEY, updatePosts);
      queryClient.setQueryData<PostWithAuthor[]>(TRENDING_KEY, updatePosts);
      queryClient.setQueryData<PostWithAuthor>(["posts", post.id], post);
      queryClient.invalidateQueries({ queryKey: ["users", authorUsername] });
      // Editing a post's rating updates the book's canonical rating too.
      if (post.book?.id) queryClient.invalidateQueries({ queryKey: ["books", post.book.id] });
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
      const updatePosts = (posts: PostWithAuthor[] | undefined) =>
        posts?.map((p) => (p.id === post.id ? { ...p, commentsDisabled: post.commentsDisabled } : p));
      queryClient.setQueryData<PostWithAuthor[]>(FEED_KEY, updatePosts);
      queryClient.setQueryData<PostWithAuthor[]>(TRENDING_KEY, updatePosts);
      queryClient.setQueryData<PostWithAuthor>(["posts", post.id], post);
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
      queryClient.invalidateQueries({ queryKey: TRENDING_KEY });
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
    onSuccess: ({ postId, isLiked }, { authorUsername }) => {
      const updatePosts = (posts: PostWithAuthor[] | undefined) =>
        posts?.map((p) =>
          p.id === postId
            ? { ...p, isLiked, likeCount: p.likeCount + (isLiked ? 1 : -1) }
            : p
        );
      queryClient.setQueryData<PostWithAuthor[]>(FEED_KEY, updatePosts);
      queryClient.setQueryData<PostWithAuthor[]>(TRENDING_KEY, updatePosts);
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

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.post("/auth/change-password", data);
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await api.delete("/users/me");
    },
  });
}

export function useUploadAvatar() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      // 1. Get presigned upload URL from our API
      const { data } = await api.post<{ uploadUrl: string; publicUrl: string }>(
        "/users/me/avatar-upload-url",
        { contentType: file.type }
      );
      // 2. PUT the file directly to R2
      await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      // 3. Save the public URL on the user's profile
      const res = await api.patch<{ user: UserProfile }>("/users/me", { avatarUrl: data.publicUrl });
      return res.data.user;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users", user.username] });
      if (me?.username) {
        queryClient.invalidateQueries({ queryKey: ["users", me.username] });
      }
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
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: TRENDING_KEY });
      // A rating attached to the post updates the book's canonical rating.
      if (post.book?.id) queryClient.invalidateQueries({ queryKey: ["books", post.book.id] });
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
    mutationFn: async ({ content, gifUrl }: { content: string; gifUrl?: string }) => {
      const res = await api.post<{ comment: CommentWithAuthor }>(`/posts/${postId}/comments`, {
        content,
        ...(gifUrl && { gifUrl }),
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

// --- GIF search ---

export function useGifSearch(query: string) {
  return useQuery({
    queryKey: ["gifs", "search", query],
    queryFn: async () => {
      const res = await api.get<{
        gifs: { id: string; title: string; previewUrl: string; gifUrl: string }[];
      }>(`/gifs/search?q=${encodeURIComponent(query)}`);
      return res.data.gifs;
    },
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000,
  });
}

// --- User search (for @mention autocomplete) ---

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      const res = await api.get<{ users: { id: string; username: string; displayName: string }[] }>(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      return res.data.users;
    },
    enabled: query.length >= 1,
    staleTime: 30 * 1000,
  });
}

// --- Notifications ---

export const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const res = await api.get<{
        notifications: GroupedNotification[];
        unreadCount: number;
      }>("/notifications");
      return res.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

// --- Shelves ---

export function useUserShelves(username: string) {
  return useQuery({
    queryKey: ["shelves", "user", username],
    queryFn: async () => {
      const res = await api.get<{ shelves: ShelfSummary[] }>(`/users/${username}/shelves`);
      return res.data.shelves;
    },
    enabled: !!username,
  });
}

export function useShelf(shelfId: string) {
  return useQuery({
    queryKey: ["shelves", "detail", shelfId],
    queryFn: async () => {
      const res = await api.get<{ shelf: ShelfWithBooks }>(`/shelves/${shelfId}`);
      return res.data.shelf;
    },
    enabled: !!shelfId,
  });
}

/** The current user's shelves, optionally annotated with membership for a book. */
export function useMyShelves(bookId?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["shelves", "me", bookId ?? "all"],
    queryFn: async () => {
      const res = await api.get<{ shelves: ShelfMembership[] }>(
        `/shelves/me${bookId ? `?bookId=${encodeURIComponent(bookId)}` : ""}`
      );
      return res.data.shelves;
    },
    enabled: isAuthenticated,
  });
}

export function useCreateShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateShelfData) => {
      const res = await api.post<{ shelf: ShelfSummary }>("/shelves", data);
      return res.data.shelf;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useRenameShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shelfId, name }: { shelfId: string; name: string }) => {
      const res = await api.patch<{ shelf: ShelfSummary }>(`/shelves/${shelfId}`, { name });
      return res.data.shelf;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useSetShelfPrivacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shelfId, isPrivate }: { shelfId: string; isPrivate: boolean }) => {
      const res = await api.patch<{ shelf: ShelfSummary }>(`/shelves/${shelfId}`, { isPrivate });
      return res.data.shelf;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useDeleteShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shelfId: string) => {
      await api.delete(`/shelves/${shelfId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useAddToShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shelfId, bookId }: { shelfId: string; bookId: string }) => {
      await api.post(`/shelves/${shelfId}/items`, { bookId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useRemoveFromShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shelfId, bookId }: { shelfId: string; bookId: string }) => {
      await api.delete(`/shelves/${shelfId}/items/${bookId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

// --- Top books (profile "Top 8") ---

export function useTopBooks(username: string) {
  return useQuery({
    queryKey: ["top-books", username],
    queryFn: async () => {
      const res = await api.get<{ books: TopBook[] }>(`/users/${username}/top-books`);
      return res.data.books;
    },
    enabled: !!username,
  });
}

export function useSetTopBooks(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookIds: string[]) => {
      const res = await api.put<{ books: TopBook[] }>("/users/me/top-books", { bookIds });
      return res.data.books;
    },
    onSuccess: (books) => {
      queryClient.setQueryData(["top-books", username], books);
    },
  });
}

// --- Feedback ---

export function useSendFeedback() {
  return useMutation({
    mutationFn: async (data: FeedbackData) => {
      await api.post("/feedback", data);
    },
  });
}
