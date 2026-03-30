import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, MoreHorizontal, Pencil, Share2, Trash2, X } from "lucide-react";
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
import { useUpdateComment, useDeleteComment, useToggleCommentLike } from "@/lib/queries";
import { shareComment } from "@/lib/shareCard";
import { Textarea } from "@/components/ui/textarea";
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

  function handleShare() {
    shareComment({
      content: comment.content,
      authorDisplayName: comment.author.displayName,
      authorUsername: comment.author.username,
      authorAvatarUrl: comment.author.avatarUrl,
      likeCount: comment.likeCount,
    });
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
        className="bg-muted/30 rounded-sm"
        style={{
          display: "flex",
          gap: "0.625rem",
          padding: "0.875rem 1rem",
        }}
      >
        {/* Avatar */}
        <div
          className="bg-primary/10 text-primary rounded-full"
          style={{
            width: "1.875rem",
            height: "1.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            flexShrink: 0,
            marginTop: "0.1rem",
            overflow: "hidden",
          }}
        >
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            comment.author.displayName[0].toUpperCase()
          )}
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
              <span className="text-foreground" style={{ fontSize: "0.8rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
                {comment.author.displayName}
              </span>
              <span
                className="comment-handle text-muted-foreground"
                style={{ fontSize: "0.72rem", transition: "color 0.15s" }}
              >
                @{comment.author.username}
              </span>
            </Link>
            <span className="text-muted-foreground" style={{ fontSize: "0.72rem", marginLeft: "auto", flexShrink: 0 }}>
              {formatDate(comment.createdAt)}
            </span>

            {/* Options menu for owners; direct share icon for non-owners */}
            {!isEditing && (canDelete || isOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Comment options"
                    className="text-muted-foreground"
                    style={{ flexShrink: 0, width: "1.5rem", height: "1.5rem" }}
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
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 size={13} />
                    Share as image
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmOpen(true)}
                        className="text-destructive"
                      >
                        <Trash2 size={13} />
                        Delete comment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Share comment as image"
                onClick={handleShare}
                className="text-muted-foreground"
                style={{ flexShrink: 0, width: "1.5rem", height: "1.5rem" }}
              >
                <Share2 size={13} />
              </Button>
            ))}

            {/* Save/discard buttons in edit mode */}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={updateComment.isPending || !editContent.trim()}
                  aria-label="Save comment"
                  className="text-primary"
                  style={{ width: "1.5rem", height: "1.5rem", flexShrink: 0 }}
                >
                  <Check size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDiscard}
                  disabled={updateComment.isPending}
                  aria-label="Discard changes"
                  className="text-destructive"
                  style={{ width: "1.5rem", height: "1.5rem", flexShrink: 0 }}
                >
                  <X size={13} />
                </Button>
              </>
            )}
          </div>

          {/* Comment content or edit textarea */}
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={500}
              rows={2}
              autoFocus
            />
          ) : (
            <p
              className="text-foreground"
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.5,
                margin: 0,
                wordBreak: "break-word",
              }}
            >
              {comment.content}
            </p>
          )}

          {/* GIF */}
          {!isEditing && comment.gifUrl && (
            <img
              src={comment.gifUrl}
              alt="GIF"
              className="rounded-md"
              style={{ maxWidth: "100%", display: "block", marginTop: "0.375rem" }}
            />
          )}

          {/* Like button */}
          {!isEditing && (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                onClick={handleLike}
                disabled={toggleLike.isPending}
                className={comment.isLiked ? "text-destructive" : "text-muted-foreground"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.75rem",
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
                    (e.currentTarget as HTMLButtonElement).style.color = "";
                }}
                aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
              >
                <Heart
                  size={13}
                  fill={comment.isLiked ? "currentColor" : "none"}
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
