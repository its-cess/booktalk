import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PostCard, { type Post } from "@/components/post/PostCard";

const DUMMY_POSTS: Post[] = [
  {
    id: "welcome",
    authorDisplayName: "BookTalk",
    authorUsername: "booktalk",
    content:
      "Hi, welcome to BookTalk! This is where book lovers share thoughts, reviews, and recommendations. Start by following people and posting about what you're reading.",
    hasSpoilers: false,
    createdAt: new Date().toISOString(),
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

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
        <p style={{ color: "#737373", marginBottom: "1.5rem", fontSize: "1rem" }}>
          Sign up or log in to start posting and following.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/login">
            <Button variant="outline">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "38rem",
        margin: "0 auto",
        padding: "2rem 1.5rem",
      }}
    >
      {/* Search bar */}
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

      {/* Feed header */}
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#171717",
          marginBottom: "1rem",
        }}
      >
        Your feed
      </h2>

      {/* Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {DUMMY_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
