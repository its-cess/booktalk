import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDeletePost, useUpdatePost } from "@/lib/queries";

export interface Post {
  id: string;
  authorDisplayName: string;
  authorUsername: string;
  content: string;
  bookTitle?: string;
  bookAuthor?: string;
  hasSpoilers: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
}

export default function PostCard({ post, isOwner = false }: PostCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

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

  return (
    <>
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e5e5",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
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

          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#171717", lineHeight: 1.3 }}>
              {post.authorDisplayName}
            </span>
            <Link
              to={`/${post.authorUsername}`}
              style={{ fontSize: "0.75rem", color: "#737373", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              @{post.authorUsername}
            </Link>
          </div>

          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#a3a3a3", flexShrink: 0 }}>
            {formatDate(post.createdAt)}
          </span>

          {isOwner && (
            isEditing ? (
              <>
                <IconBtn
                  label="Save changes"
                  onClick={handleSave}
                  disabled={updatePost.isPending || !editContent.trim()}
                  hoverColor="#16a34a"
                >
                  <Check size={14} />
                </IconBtn>
                <IconBtn
                  label="Discard changes"
                  onClick={handleDiscard}
                  disabled={updatePost.isPending}
                  hoverColor="#737373"
                >
                  <X size={14} />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn label="Edit post" onClick={() => setIsEditing(true)} hoverColor="#4338ca">
                  <Pencil size={14} />
                </IconBtn>
                <IconBtn label="Delete post" onClick={() => setConfirmOpen(true)} hoverColor="#ef4444">
                  <Trash2 size={14} />
                </IconBtn>
              </>
            )
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
            <Button variant="outline" size="sm" onClick={() => setSpoilerRevealed(true)}>
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
                onClick={() => setSpoilerRevealed(false)}
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

function IconBtn({
  label,
  onClick,
  disabled,
  hoverColor,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hoverColor: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ color: "#a3a3a3", flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.color = hoverColor; }}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#a3a3a3")}
    >
      {children}
    </Button>
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
