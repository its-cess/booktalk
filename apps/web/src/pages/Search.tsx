import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useSearchPosts, useSearchUsers } from "@/lib/queries";
import PostCard from "@/components/post/PostCard";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const urlQuery = searchParams.get("q") ?? "";
  const { data: posts, isFetching: postsFetching, isError } = useSearchPosts(urlQuery);
  const { data: users, isFetching: usersFetching } = useSearchUsers(urlQuery);

  const isFetching = postsFetching || usersFetching;
  const hasResults = (users?.length ?? 0) > 0 || (posts?.length ?? 0) > 0;

  return (
    <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Results heading */}
      {urlQuery.length >= 2 && (
        <h2
          className="text-foreground"
          style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}
        >
          {isFetching ? "Searching…" : `Results for "${urlQuery}"`}
        </h2>
      )}

      {/* States */}
      {urlQuery.length < 2 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          Type at least 2 characters to search.
        </p>
      )}

      {isError && (
        <p className="text-destructive" style={{ fontSize: "0.9rem" }}>
          Search failed. Please try again.
        </p>
      )}

      {!isFetching && !isError && urlQuery.length >= 2 && !hasResults && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          No results found for "{urlQuery}".
        </p>
      )}

      {/* User results */}
      {users && users.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3
            className="text-muted-foreground"
            style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.625rem" }}
          >
            People
          </h3>
          <div
            className="bg-background rounded-sm"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {users.map((u, i) => (
              <Link
                key={u.id}
                to={`/${u.username}`}
                className="hover:bg-muted/50 transition-colors"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none",
                  textDecoration: "none",
                }}
              >
                <div
                  className="bg-muted text-muted-foreground"
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "50%",
                    flexShrink: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.displayName ?? u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (u.displayName ?? u.username).charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: 0 }}>
                  <span className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.displayName ?? u.username}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    @{u.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Post results */}
      {posts && posts.length > 0 && (
        <div>
          {users && users.length > 0 && (
            <h3
              className="text-muted-foreground"
              style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.625rem" }}
            >
              Posts
            </h3>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {posts.map((post) => (
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
                  rating: post.rating,
                  dnf: post.dnf,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
