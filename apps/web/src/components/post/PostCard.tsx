import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function PostCard({ post }: { post: Post }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  return (
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
          <span style={{ fontSize: "0.75rem", color: "#737373" }}>
            @{post.authorUsername}
          </span>
        </div>

        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#a3a3a3", flexShrink: 0 }}>
          {formatDate(post.createdAt)}
        </span>
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

      {/* Content */}
      {post.hasSpoilers && !spoilerRevealed ? (
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
          <p style={{ fontSize: "0.875rem", color: "#737373" }}>
            This post contains spoilers
          </p>
          <Button variant="outline" size="sm" onClick={() => setSpoilerRevealed(true)}>
            Show anyway
          </Button>
        </div>
      ) : (
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#262626", margin: 0 }}>
          {post.content}
        </p>
      )}
    </div>
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
