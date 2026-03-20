import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircleOff, Smile, ImagePlay, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePost, useComments, useCreateComment } from "@/lib/queries";
import PostCard from "@/components/post/PostCard";
import CommentCard from "@/components/post/CommentCard";
import MentionTextarea from "@/components/post/MentionTextarea";
import { Button } from "@/components/ui/button";
import EmojiPicker, { type EmojiClickData, EmojiStyle } from "emoji-picker-react";
import GifPicker from "@/components/post/GifPicker";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { data: post, isLoading: postLoading, isError: postError } = usePost(id!);
  const { data: comments, isLoading: commentsLoading } = useComments(id!);
  const createComment = useCreateComment(id!);

  const [commentText, setCommentText] = useState("");
  const [commentGifUrl, setCommentGifUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const gifPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (gifPickerRef.current && !gifPickerRef.current.contains(e.target as Node)) {
        setShowGifPicker(false);
      }
    }
    if (showGifPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGifPicker]);

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
      await createComment.mutateAsync({ content: trimmed, gifUrl: commentGifUrl ?? undefined });
      setCommentText("");
      setCommentGifUrl(null);
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
            <MentionTextarea
              value={commentText}
              onChange={setCommentText}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment"
              maxLength={500}
              rows={2}
              style={{
                resize: "none",
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            />
            {/* GIF preview */}
            {commentGifUrl && (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={commentGifUrl}
                  alt="Selected GIF"
                  style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "0.375rem", display: "block" }}
                />
                <button
                  type="button"
                  onClick={() => setCommentGifUrl(null)}
                  aria-label="Remove GIF"
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    color: "#ffffff",
                  }}
                >
                  <X size={10} />
                </button>
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: 0, zIndex: 50 }}
                >
                  <EmojiPicker
                    onEmojiClick={(data: EmojiClickData) => {
                      setCommentText((prev) => prev + data.emoji);
                      setShowEmojiPicker(false);
                    }}
                    emojiStyle={EmojiStyle.GOOGLE}
                    previewConfig={{ showPreview: false }}
                    height={350}
                    width={300}
                    style={{ "--epr-emoji-size": "22px", "--epr-emoji-padding": "4px", "--epr-category-navigation-button-size": "22px" } as React.CSSProperties}
                  />
                </div>
              )}
              {showGifPicker && (
                <div
                  ref={gifPickerRef}
                  style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: "2.5rem", zIndex: 50 }}
                >
                  <GifPicker
                    onSelect={(url) => {
                      setCommentGifUrl(url);
                      setShowGifPicker(false);
                    }}
                  />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  style={{
                    padding: "0.25rem 0.375rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e5e5",
                    background: showEmojiPicker ? "#f0f0f0" : "none",
                    cursor: "pointer",
                    color: "#525252",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Insert emoji"
                >
                  <Smile size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowGifPicker((v) => !v)}
                  style={{
                    padding: "0.25rem 0.375rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e5e5",
                    background: showGifPicker ? "#f0f0f0" : "none",
                    cursor: "pointer",
                    color: "#525252",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Insert GIF"
                >
                  <ImagePlay size={15} />
                </button>
                <span style={{ fontSize: "0.72rem", color: "#a3a3a3" }}>
                  {commentText.length}/500
                </span>
              </div>
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
