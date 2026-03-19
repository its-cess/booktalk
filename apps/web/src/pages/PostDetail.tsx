import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircleOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePost, useComments, useCreateComment } from "@/lib/queries";
import PostCard from "@/components/post/PostCard";
import CommentCard from "@/components/post/CommentCard";
import { Button } from "@/components/ui/button";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { data: post, isLoading: postLoading, isError: postError } = usePost(id!);
  const { data: comments, isLoading: commentsLoading } = useComments(id!);
  const createComment = useCreateComment(id!);

  const [commentText, setCommentText] = useState("");

  if (postLoading) {
    return (
      <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "2rem 1.5rem", color: "#a3a3a3" }}>
        Loading…
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "2rem 1.5rem", color: "#ef4444" }}>
        Post not found.
      </div>
    );
  }

  const isPostOwner = user?.id === post.author.id;

  async function handleSubmitComment() {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    try {
      await createComment.mutateAsync(trimmed);
      setCommentText("");
    } catch {
      toast.error("Failed to post comment.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  }

  return (
    <div style={{ maxWidth: "38rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.875rem",
          color: "#737373",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: "1.25rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#171717")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Post */}
      <PostCard
        post={{
          id: post.id,
          authorDisplayName: post.author.displayName,
          authorUsername: post.author.username,
          content: post.content,
          bookTitle: post.bookTitle ?? undefined,
          bookAuthor: post.bookAuthor ?? undefined,
          hasSpoilers: post.hasSpoilers,
          commentsDisabled: post.commentsDisabled,
          createdAt: post.createdAt,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          isLiked: post.isLiked,
        }}
        isOwner={isPostOwner}
        isDetailView
      />

      {/* Comments section */}
      <div style={{ marginTop: "1.75rem" }}>
        <h2
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#171717",
            marginBottom: "1rem",
          }}
        >
          Comments
        </h2>

        {/* Comments disabled notice */}
        {post.commentsDisabled && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "#a3a3a3",
              backgroundColor: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: "0.625rem",
              padding: "0.875rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <MessageCircleOff size={15} style={{ flexShrink: 0 }} />
            Comments have been disabled for this post.
          </div>
        )}

        {/* Comment input */}
        {isAuthenticated && !post.commentsDisabled && (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "0.625rem",
              padding: "0.875rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment"
              maxLength={500}
              rows={2}
              style={{
                width: "100%",
                resize: "none",
                border: "1px solid #e5e5e5",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                color: "#171717",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4338ca")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "#a3a3a3" }}>
                {commentText.length}/500
              </span>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || createComment.isPending}
              >
                {createComment.isPending ? "Posting…" : "Send"}
              </Button>
            </div>
          </div>
        )}

        {/* Comment list — hidden when comments are disabled */}
        {!post.commentsDisabled && (
          commentsLoading ? (
            <p style={{ color: "#a3a3a3", fontSize: "0.875rem" }}>Loading comments…</p>
          ) : comments && comments.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  postId={id!}
                  isOwner={user?.id === comment.author.id}
                  isPostOwner={isPostOwner}
                />
              ))}
            </div>
          ) : (
            <p
              style={{
                color: "#a3a3a3",
                fontSize: "0.875rem",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              No comments yet.{isAuthenticated ? " Be the first!" : ""}
            </p>
          )
        )}
      </div>
    </div>
  );
}
