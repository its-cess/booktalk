import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useUpdateComment, useDeleteComment, useToggleCommentLike } from "@/lib/queries";
import type { CommentWithAuthor } from "@booktalk/shared";

interface CommentCardProps {
  comment: CommentWithAuthor;
  postId: string;
  isOwner: boolean;
  isPostOwner: boolean;
}

export default function CommentCard({
  comment,
  postId,
  isOwner,
  isPostOwner,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const updateComment = useUpdateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const toggleLike = useToggleCommentLike(postId);

  async function handleSave() {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      await updateComment.mutateAsync({ commentId: comment.id, content: trimmed });
      setIsEditing(false);
    } catch {
      toast.error("Failed to save comment.");
    }
  }

  function handleDiscard() {
    setEditContent(comment.content);
    setIsEditing(false);
  }

  async function handleDelete() {
    try {
      await deleteComment.mutateAsync(comment.id);
      setConfirmOpen(false);
    } catch {
      toast.error("Failed to delete comment.");
    }
  }

  async function handleLike() {
    try {
      await toggleLike.mutateAsync(comment.id);
    } catch {
      toast.error("Failed to like comment.");
    }
  }

  const canDelete = isOwner || isPostOwner;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.625rem",
          padding: "0.875rem 1rem",
          backgroundColor: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: "0.625rem",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "1.875rem",
            height: "1.875rem",
            borderRadius: "50%",
            backgroundColor: "#e0e7ff",
            color: "#4338ca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            flexShrink: 0,
            marginTop: "0.1rem",
          }}
        >
          {comment.author.displayName[0].toUpperCase()}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author + timestamp row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "0.25rem",
            }}
          >
            <Link
              to={`/${comment.author.username}`}
              style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: "0.3rem" }}
              onMouseEnter={(e) => {
                (e.currentTarget.querySelector(".comment-handle") as HTMLElement).style.color =
                  "#4338ca";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.querySelector(".comment-handle") as HTMLElement).style.color =
                  "#737373";
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#171717" }}>
                {comment.author.displayName}
              </span>
              <span
                className="comment-handle"
                style={{ fontSize: "0.72rem", color: "#737373", transition: "color 0.15s" }}
              >
                @{comment.author.username}
              </span>
            </Link>
            <span style={{ fontSize: "0.72rem", color: "#a3a3a3", marginLeft: "auto", flexShrink: 0 }}>
              {formatDate(comment.createdAt)}
            </span>

            {/* Actions menu */}
            {(isOwner || canDelete) && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Comment options"
                    style={{
                      color: "#a3a3a3",
                      flexShrink: 0,
                      width: "1.5rem",
                      height: "1.5rem",
                    }}
                  >
                    <MoreHorizontal size={13} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil size={13} />
                      Edit comment
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => setConfirmOpen(true)}
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={13} />
                      Delete comment
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Save/discard buttons in edit mode */}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={updateComment.isPending || !editContent.trim()}
                  aria-label="Save comment"
                  style={{ color: "#16a34a", width: "1.5rem", height: "1.5rem", flexShrink: 0 }}
                >
                  <Check size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDiscard}
                  disabled={updateComment.isPending}
                  aria-label="Discard changes"
                  style={{ color: "#737373", width: "1.5rem", height: "1.5rem", flexShrink: 0 }}
                >
                  <X size={13} />
                </Button>
              </>
            )}
          </div>

          {/* Comment content or edit textarea */}
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={500}
              rows={2}
              autoFocus
              style={{
                width: "100%",
                resize: "vertical",
                border: "1px solid #a3a3a3",
                borderRadius: "0.375rem",
                padding: "0.375rem 0.5rem",
                fontSize: "0.85rem",
                lineHeight: 1.5,
                color: "#171717",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4338ca")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#a3a3a3")}
            />
          ) : (
            <p
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.5,
                color: "#262626",
                margin: 0,
                wordBreak: "break-word",
              }}
            >
              {comment.content}
            </p>
          )}

          {/* Like button */}
          {!isEditing && (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                onClick={handleLike}
                disabled={toggleLike.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.75rem",
                  color: comment.isLiked ? "#ef4444" : "#a3a3a3",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!comment.isLiked)
                    (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  if (!comment.isLiked)
                    (e.currentTarget as HTMLButtonElement).style.color = "#a3a3a3";
                }}
                aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
              >
                <Heart
                  size={13}
                  fill={comment.isLiked ? "#ef4444" : "none"}
                  style={{ flexShrink: 0 }}
                />
                <span>{comment.likeCount}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete comment"
        description="This can't be undone. Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        isPending={deleteComment.isPending}
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
