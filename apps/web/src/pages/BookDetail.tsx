import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookmarkPlus, Loader2, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useBookDetail, useRateBook, useRemoveRating } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import StarRating, { DnfBadge } from "@/components/ui/StarRating";
import AddToShelfMenu from "@/components/shelf/AddToShelfMenu";
import PostCard from "@/components/post/PostCard";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useBookDetail(id!);
  const rate = useRateBook(id!);
  const removeRating = useRemoveRating(id!);
  const [ratingEditing, setRatingEditing] = useState(false);

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

  const { book, posts, myRating, averageRating, ratingCount } = data;

  function handleRate(value: number) {
    setRatingEditing(false);
    rate.mutate(
      { rating: value, dnf: false },
      { onError: () => toast.error("Failed to save your rating.") }
    );
  }
  function handleDnf() {
    setRatingEditing(false);
    rate.mutate(
      { rating: null, dnf: true },
      { onError: () => toast.error("Failed to save your rating.") }
    );
  }
  function handleClearRating() {
    setRatingEditing(false);
    removeRating.mutate(undefined, {
      onError: () => toast.error("Failed to clear your rating."),
    });
  }

  const hasMyRating = !!myRating && (myRating.rating != null || myRating.dnf);

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

          {/* Ratings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            {averageRating != null ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <StarRating value={averageRating} readOnly size={18} />
                <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                  {averageRating.toFixed(1)} · {ratingCount} rating{ratingCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                Not enough ratings yet
              </span>
            )}

            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                {(hasMyRating || ratingEditing) && (
                  <span
                    className="text-foreground basis-full md:basis-auto"
                    style={{ fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    Your rating:
                  </span>
                )}

                {ratingEditing ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <StarRating
                      value={myRating && !myRating.dnf ? myRating.rating : null}
                      dnf={myRating?.dnf ?? false}
                      onChange={handleRate}
                      onDnf={handleDnf}
                      onClear={handleClearRating}
                      size={24}
                    />
                    <button
                      type="button"
                      onClick={() => setRatingEditing(false)}
                      className="text-muted-foreground hover:text-foreground"
                      style={{ fontSize: "0.75rem", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : hasMyRating ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    {myRating!.dnf ? (
                      <DnfBadge />
                    ) : (
                      <StarRating value={myRating!.rating} readOnly size={22} />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRatingEditing(true)}
                      aria-label="Edit rating"
                      className="text-muted-foreground h-7 w-7"
                    >
                      <Pencil size={13} />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setRatingEditing(true)} className="gap-1.5">
                    <Star size={14} /> Add rating
                  </Button>
                )}
              </div>
            )}
          </div>

          {user && (
            <div style={{ marginBottom: "1rem" }}>
              <AddToShelfMenu bookId={book.id}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <BookmarkPlus size={14} /> Add to shelf
                </Button>
              </AddToShelfMenu>
            </div>
          )}

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
                rating: post.rating,
                dnf: post.dnf,
              }}
              isOwner={user?.id === post.author.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
