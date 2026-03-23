import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFeed, useTrendingFeed, useToggleFollow, FEED_KEY, TRENDING_KEY } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/post/PostCard";
import PostComposer from "@/components/post/PostComposer";
import type { PostWithAuthor } from "@booktalk/shared";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: feedPosts, isLoading: feedLoading, isError: feedError } = useFeed();
  const { data: trendingPosts, isLoading: trendingLoading } = useTrendingFeed(true);

  const isFeedEmpty = !feedLoading && !feedError && feedPosts?.length === 0;
  const isLoading = feedLoading || trendingLoading;

  const feedIds = new Set(feedPosts?.map((p) => p.id) ?? []);
  const paddedTrending = trendingPosts?.filter((p) => !feedIds.has(p.id)) ?? [];
  const posts = [...(feedPosts ?? []), ...paddedTrending];

  const toggleFollow = useToggleFollow();

  async function handleFollow(post: PostWithAuthor) {
    await toggleFollow.mutateAsync(post.author.username);
    queryClient.invalidateQueries({ queryKey: FEED_KEY });
    queryClient.invalidateQueries({ queryKey: TRENDING_KEY });
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h2 className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', marginBottom: "0.75rem" }}>
          BookTok for Millennials
        </h2>
        <p className="text-muted-foreground" style={{ marginBottom: "1.5rem" }}>
          Sign up or log in to start posting and following.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline" onClick={() => navigate("/login")}>Log in</Button>
          <Button onClick={() => navigate("/signup")}>Sign up</Button>
        </div>
      </div>
    );
  }

  function renderPostCard(post: PostWithAuthor) {
    return (
      <PostCard
        key={post.id}
        isOwner={user?.id === post.author.id}
        isFollowingAuthor={post.isFollowingAuthor}
        onFollowAuthor={user?.id !== post.author.id ? () => handleFollow(post) : undefined}
        post={{
          id: post.id,
          authorDisplayName: post.author.displayName,
          authorUsername: post.author.username,
          authorAvatarUrl: post.author.avatarUrl,
          content: post.content,
          book: post.book ?? null,
          bookTitle: post.bookTitle ?? undefined,
          bookAuthor: post.bookAuthor ?? undefined,
          hasSpoilers: post.hasSpoilers,
          commentsDisabled: post.commentsDisabled,
          gifUrl: post.gifUrl,
          createdAt: post.createdAt,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          isLiked: post.isLiked,
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "1rem 1.5rem" }}>
      {/* Composer — hidden on mobile (use the nav button instead) */}
      <div className="hidden md:block">
        <PostComposer />
      </div>

      <h2 className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', marginBottom: isFeedEmpty ? "0.25rem" : "1rem" }}>
        {isFeedEmpty ? "Trending" : "Your feed"}
      </h2>

      {isFeedEmpty && (
        <p className="text-muted-foreground" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
          Follow people to see their posts here. In the meantime, here's what's popular.
        </p>
      )}

      {isLoading && (
        <div className="text-muted-foreground" style={{ display: "flex", justifyContent: "center", padding: "2rem 0" }}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {feedError && (
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>Failed to load feed.</p>
      )}

      {!isLoading && posts.length === 0 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          Nothing to show right now.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {posts.map(renderPostCard)}
      </div>
    </div>
  );
}
