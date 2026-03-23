import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBookDetail } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/post/PostCard";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useBookDetail(id!);

  if (isLoading) {
    return (
      <div className="text-muted-foreground" style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem", display: "flex", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-destructive" style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
        Book not found.
      </div>
    );
  }

  const { book, posts } = data;

  return (
    <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-muted-foreground mb-4 -ml-2 gap-1"
      >
        <ArrowLeft size={15} />
        Back
      </Button>

      {/* Book header */}
      <div
        className="bg-background rounded-sm"
        style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
      >
        {book.coverUrl && (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="rounded-sm"
            style={{ width: "96px", flexShrink: 0, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="text-foreground"
            style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', marginBottom: "0.25rem", lineHeight: 1.3 }}
          >
            {book.title}
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
            {book.author}
          </p>

          {book.description ? (
            <p className="text-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {book.description}
            </p>
          ) : (
            <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
              No description available.
            </p>
          )}
        </div>
      </div>

      {/* Posts about this book */}
      <h2
        className="text-foreground"
        style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', marginBottom: "1rem" }}
      >
        Posts about this book
      </h2>

      {posts.length === 0 ? (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          No posts yet. Be the first to post about this book!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                authorDisplayName: post.author.displayName,
                authorUsername: post.author.username,
                authorAvatarUrl: post.author.avatarUrl,
                content: post.content,
                book: post.book ? { id: post.book.id, title: post.book.title, author: post.book.author, coverUrl: post.book.coverUrl } : null,
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
              isOwner={user?.id === post.author.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
