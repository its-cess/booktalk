import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFeed } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PostCard from "@/components/post/PostCard";
import PostComposer from "@/components/post/PostComposer";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: posts, isLoading, isError } = useFeed();

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
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#171717", marginBottom: "0.75rem" }}>
          BookTok for Millennials
        </h2>
        <p style={{ color: "#737373", marginBottom: "1.5rem" }}>
          Sign up or log in to start posting and following.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/login"><Button variant="outline">Log in</Button></Link>
          <Link to="/signup"><Button>Sign up</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.75rem", width: "100%" }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#a3a3a3",
            pointerEvents: "none",
          }}
        />
        <Input
          placeholder="Search books or posts..."
          style={{ paddingLeft: "2.25rem", width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {/* Composer */}
      <PostComposer />

      {/* Feed */}
      <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#171717", marginBottom: "1rem" }}>
        Your feed
      </h2>

      {isLoading && (
        <p style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>Loading…</p>
      )}

      {isError && (
        <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>Failed to load feed.</p>
      )}

      {posts && posts.length === 0 && (
        <p style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
          No posts yet. Be the first to post!
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {posts?.map((post) => (
          <PostCard
            key={post.id}
            isOwner={user?.id === post.author.id}
            post={{
              id: post.id,
              authorDisplayName: post.author.displayName,
              authorUsername: post.author.username,
              content: post.content,
              bookTitle: post.bookTitle ?? undefined,
              bookAuthor: post.bookAuthor ?? undefined,
              hasSpoilers: post.hasSpoilers,
              createdAt: post.createdAt,
            }}
          />
        ))}
      </div>
    </div>
  );
}
