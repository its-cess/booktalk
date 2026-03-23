import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useFeed } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/post/PostCard";
import PostComposer from "@/components/post/PostComposer";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: posts, isLoading, isError } = useFeed();
  const navigate = useNavigate();

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

  return (
    <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "1rem 1.5rem" }}>
      {/* Composer */}
      <PostComposer />

      {/* Feed */}
      <h2 className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', marginBottom: "1rem" }}>
        Your feed
      </h2>

      {isLoading && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>Loading…</p>
      )}

      {isError && (
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>Failed to load feed.</p>
      )}

      {posts && posts.length === 0 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          No posts yet. Be the first to post!
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {posts?.map((post) => (
          <PostCard
            key={post.id}
            isOwner={user?.id === post.author.id}
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
        ))}
      </div>
    </div>
  );
}
