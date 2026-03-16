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
      className="rounded-xl p-4 space-y-3"
      style={{ border: "1px solid #e5e5e5", backgroundColor: "#ffffff" }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: "#e5e5e5", color: "#404040" }}
        >
          {post.authorDisplayName[0].toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm leading-tight">{post.authorDisplayName}</span>
          <span className="text-xs" style={{ color: "#737373" }}>
            @{post.authorUsername}
          </span>
        </div>
        <span className="ml-auto text-xs flex-shrink-0" style={{ color: "#a3a3a3" }}>
          {formatDate(post.createdAt)}
        </span>
      </div>

      {/* Book tag */}
      {post.bookTitle && (
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md w-fit"
          style={{ backgroundColor: "#f5f5f5", color: "#525252" }}
        >
          <BookOpen className="w-3 h-3 flex-shrink-0" />
          <span>
            {post.bookTitle}
            {post.bookAuthor && ` · ${post.bookAuthor}`}
          </span>
        </div>
      )}

      {/* Content */}
      {post.hasSpoilers && !spoilerRevealed ? (
        <div
          className="rounded-lg p-4 text-center space-y-2"
          style={{ backgroundColor: "#f5f5f5" }}
        >
          <p className="text-sm" style={{ color: "#737373" }}>
            This post contains spoilers
          </p>
          <Button variant="outline" size="sm" onClick={() => setSpoilerRevealed(true)}>
            Show anyway
          </Button>
        </div>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: "#262626" }}>
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
