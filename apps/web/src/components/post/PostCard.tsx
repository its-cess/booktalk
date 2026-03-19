import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Check,
  Heart,
  MessageCircle,
  MessageCircleOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useDeletePost,
  useUpdatePost,
  useTogglePostLike,
  useToggleCommentsDisabled,
} from "@/lib/queries";

export interface Post {
  id: string;
  authorDisplayName: string;
  authorUsername: string;
  content: string;
  bookTitle?: string;
  bookAuthor?: string;
  hasSpoilers: boolean;
  commentsDisabled: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  isDetailView?: boolean;
}

export default function PostCard({ post, isOwner = false, isDetailView = false }: PostCardProps) {
  const navigate = useNavigate();
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const toggleLike = useTogglePostLike();
  const toggleComments = useToggleCommentsDisabled();

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(post.id);
      setConfirmOpen(false);
    } catch {
      toast.error("Failed to delete post.");
    }
  }

  async function handleSave() {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      await updatePost.mutateAsync({ postId: post.id, content: trimmed });
      setIsEditing(false);
    } catch {
      toast.error("Failed to save changes.");
    }
  }

  function handleDiscard() {
    setEditContent(post.content);
    setIsEditing(false);
  }

  async function handleLike() {
    try {
      await toggleLike.mutateAsync(post.id);
    } catch {
      toast.error("Failed to like post.");
    }
  }

  async function handleToggleComments() {
    try {
      await toggleComments.mutateAsync({
        postId: post.id,
        commentsDisabled: !post.commentsDisabled,
      });
    } catch {
      toast.error("Failed to update comment settings.");
    }
  }

  function handleCardClick() {
    if (!isEditing && !isDetailView) {
      navigate(`/posts/${post.id}`);
    }
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e5e5",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          cursor: isEditing || isDetailView ? "default" : "pointer",
        }}
      >
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "50%",
              backgroundColor: "#e0e7ff",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {post.authorDisplayName[0].toUpperCase()}
          </div>

          <Link
            to={`/${post.authorUsername}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.375rem",
              minWidth: 0,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget.querySelector(".author-handle") as HTMLElement).style.color =
                "#4338ca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.querySelector(".author-handle") as HTMLElement).style.color =
                "#737373";
            }}
          >
            <span
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "#171717", lineHeight: 1.3 }}
            >
              {post.authorDisplayName}
            </span>
            <span
              className="author-handle"
              style={{ fontSize: "0.75rem", color: "#737373", transition: "color 0.15s" }}
            >
              @{post.authorUsername}
            </span>
          </Link>

          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              color: "#a3a3a3",
              flexShrink: 0,
            }}
          >
            {formatDate(post.createdAt)}
          </span>

          {/* Owner controls — stopPropagation so clicks here don't trigger card navigation */}
          {isOwner && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    disabled={updatePost.isPending || !editContent.trim()}
                    aria-label="Save changes"
                    style={{ color: "#16a34a", flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDiscard}
                    disabled={updatePost.isPending}
                    aria-label="Discard changes"
                    style={{ color: "#737373", flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
                  >
                    <X size={14} />
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Post options"
                      style={{ color: "#a3a3a3", flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil size={14} />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleToggleComments}
                      disabled={toggleComments.isPending}
                    >
                      {post.commentsDisabled ? (
                        <MessageCircle size={14} />
                      ) : (
                        <MessageCircleOff size={14} />
                      )}
                      {post.commentsDisabled ? "Enable comments" : "Disable comments"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmOpen(true)}
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={14} />
                      Delete post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Book tag */}
        {post.bookTitle && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.75rem",
              backgroundColor: "#f5f5f5",
              color: "#525252",
              padding: "0.25rem 0.625rem",
              borderRadius: "0.375rem",
              width: "fit-content",
            }}
          >
            <BookOpen size={12} style={{ flexShrink: 0 }} />
            <span>
              {post.bookTitle}
              {post.bookAuthor && ` · ${post.bookAuthor}`}
            </span>
          </div>
        )}

        {/* Content — textarea in edit mode, text otherwise */}
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            aria-label="Edit post content"
            style={{
              width: "100%",
              resize: "vertical",
              border: "1px solid #a3a3a3",
              borderRadius: "0.5rem",
              padding: "0.625rem 0.75rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#171717",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#4338ca")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#a3a3a3")}
            autoFocus
          />
        ) : post.hasSpoilers && !spoilerRevealed ? (
          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "0.5rem",
              padding: "1rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "#737373" }}>This post contains spoilers</p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setSpoilerRevealed(true); }}
            >
              Show anyway
            </Button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#262626", margin: 0 }}>
              {post.content}
            </p>
            {post.hasSpoilers && spoilerRevealed && (
              <button
                onClick={(e) => { e.stopPropagation(); setSpoilerRevealed(false); }}
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#a3a3a3",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#525252")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#a3a3a3")}
              >
                Hide spoiler
              </button>
            )}
          </div>
        )}

        {/* Action bar — stopPropagation so clicks here don't trigger card navigation */}
        {!isEditing && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              gap: "1rem",
              paddingTop: "0.25rem",
              borderTop: "1px solid #f5f5f5",
            }}
          >
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.8rem",
                color: post.isLiked ? "#ef4444" : "#a3a3a3",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!post.isLiked)
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                if (!post.isLiked)
                  (e.currentTarget as HTMLButtonElement).style.color = "#a3a3a3";
              }}
              aria-label={post.isLiked ? "Unlike post" : "Like post"}
            >
              <Heart
                size={15}
                fill={post.isLiked ? "#ef4444" : "none"}
                style={{ flexShrink: 0 }}
              />
              <span>{post.likeCount}</span>
            </button>

            {/* Comment — hidden when comments are disabled */}
            {!post.commentsDisabled && (
              <button
                onClick={() => !isDetailView && navigate(`/posts/${post.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.8rem",
                  color: "#a3a3a3",
                  background: "none",
                  border: "none",
                  cursor: isDetailView ? "default" : "pointer",
                  padding: "0.25rem 0",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isDetailView)
                    (e.currentTarget as HTMLButtonElement).style.color = "#4338ca";
                }}
                onMouseLeave={(e) => {
                  if (!isDetailView)
                    (e.currentTarget as HTMLButtonElement).style.color = "#a3a3a3";
                }}
                aria-label="View comments"
              >
                <MessageCircle size={15} style={{ flexShrink: 0 }} />
                <span>{post.commentCount}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete post"
        description="This can't be undone. Are you sure you want to delete this post?"
        confirmLabel="Delete"
        isPending={deletePost.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
