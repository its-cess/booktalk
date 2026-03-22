import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSearchPosts } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/post/PostCard";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const urlQuery = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(urlQuery);

  // Keep input in sync when URL changes (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  // Navigate home when input is cleared
  useEffect(() => {
    if (searchInput.trim() !== "") return;
    const timer = setTimeout(() => navigate("/"), 350);
    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  const { data: posts, isFetching, isError } = useSearchPosts(urlQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Search input */}
      <form onSubmit={handleSubmit} style={{ position: "relative", marginBottom: "1.75rem" }}>
        <Search
          size={16}
          className="text-muted-foreground"
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search books or posts..."
          autoFocus
          style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem", width: "100%", boxSizing: "border-box" }}
        />
        {searchInput && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSearchInput("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
          >
            <X size={15} />
          </Button>
        )}
      </form>

      {/* Results heading */}
      {urlQuery.length >= 2 && (
        <h2 className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
          {isFetching
            ? "Searching…"
            : `Results for "${urlQuery}"`}
        </h2>
      )}

      {/* States */}
      {urlQuery.length < 2 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          Type at least 2 characters to search.
        </p>
      )}

      {isError && (
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>Search failed. Please try again.</p>
      )}

      {!isFetching && !isError && urlQuery.length >= 2 && posts?.length === 0 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          No posts found for "{urlQuery}".
        </p>
      )}

      {/* Post results */}
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
