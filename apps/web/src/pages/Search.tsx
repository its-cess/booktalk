import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useSearchPosts } from "@/lib/queries";
import PostCard from "@/components/post/PostCard";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const urlQuery = searchParams.get("q") ?? "";
  const { data: posts, isFetching, isError } = useSearchPosts(urlQuery);

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

      {!isFetching && !isError && urlQuery.length >= 2 && posts?.length === 0 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          No posts found for "{urlQuery}".
        </p>
      )}

      {/* Post results */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
