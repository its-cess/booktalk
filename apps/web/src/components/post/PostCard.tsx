import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBookPicker } from "./useBookPicker";
import { SelectedBookChip, BookSearchPanel } from "./BookSearch";
import {
  BookOpen,
  Check,
  Heart,
  MessageCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  book?: { title: string; author: string; coverUrl: string | null } | null;
  bookTitle?: string;
  bookAuthor?: string;
  hasSpoilers: boolean;
  commentsDisabled: boolean;
  gifUrl?: string | null;
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
  const [editHasSpoilers, setEditHasSpoilers] = useState(post.hasSpoilers);
  const [bookCleared, setBookCleared] = useState(false);
  const bookPicker = useBookPicker();
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");

  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const toggleLike = useTogglePostLike();
  const toggleComments = useToggleCommentsDisabled();

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(post.id);
      setConfirmOpen(false);
      if (isDetailView) navigate("/");
    } catch {
      toast.error("Failed to delete post.");
    }
  }

  async function handleSave() {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      await updatePost.mutateAsync({
        postId: post.id,
        content: trimmed,
        authorUsername: post.authorUsername,
        hasSpoilers: editHasSpoilers,
        ...(bookCleared && { clearBook: true }),
        ...(bookPicker.selectedBook && { bookId: bookPicker.selectedBook.id }),
        ...(bookPicker.bookMode === "manual" && manualTitle.trim() && {
          bookTitle: manualTitle.trim(),
          bookAuthor: manualAuthor.trim() || undefined,
        }),
      });
      setIsEditing(false);
      setBookCleared(false);
      setManualTitle("");
      setManualAuthor("");
      bookPicker.clear();
    } catch {
      toast.error("Failed to save changes.");
    }
  }

  function handleDiscard() {
    setEditContent(post.content);
    setEditHasSpoilers(post.hasSpoilers);
    setIsEditing(false);
    setBookCleared(false);
    setManualTitle("");
    setManualAuthor("");
    bookPicker.clear();
  }

  async function handleLike() {
    try {
      await toggleLike.mutateAsync({ postId: post.id, authorUsername: post.authorUsername });
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
        className="bg-background border border-border rounded-sm"
        style={{
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
            className="bg-primary/10 text-primary rounded-full"
            style={{
              width: "2.25rem",
              height: "2.25rem",
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
              className="text-foreground"
              style={{ fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.3, fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}
            >
              {post.authorDisplayName}
            </span>
            <span
              className="author-handle text-muted-foreground"
              style={{ fontSize: "0.75rem", transition: "color 0.15s" }}
            >
              @{post.authorUsername}
            </span>
          </Link>

          <span
            className="text-muted-foreground"
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
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
                    className="text-primary"
                    style={{ flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDiscard}
                    disabled={updatePost.isPending}
                    aria-label="Discard changes"
                    className="text-destructive"
                    style={{ flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
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
                      className="text-muted-foreground"
                      style={{ flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleToggleComments}
                      disabled={toggleComments.isPending}
                    >
                      {post.commentsDisabled ? "Enable comments" : "Disable comments"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmOpen(true)}
                      className="text-destructive"
                    >
                      Delete post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Book + content section — two-column when cover is available */}
        {(() => {
          const displayBook = post.book
            ? { title: post.book.title, author: post.book.author, coverUrl: post.book.coverUrl }
            : post.bookTitle
            ? { title: post.bookTitle, author: post.bookAuthor ?? null, coverUrl: null }
            : null;

          const hasCover = !!displayBook?.coverUrl && !bookCleared;

          return (
            <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
              {/* Cover image */}
              {hasCover && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: "relative", flexShrink: 0, width: "72px" }}
                >
                  <img
                    src={displayBook!.coverUrl!}
                    alt={displayBook!.title}
                    className="rounded-sm"
                    style={{
                      width: "72px",
                      objectFit: "cover",
                      display: "block",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }}
                  />
                  {isOwner && isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setBookCleared(true)}
                      aria-label="Remove book"
                      className="absolute top-0.5 right-0.5 h-[18px] w-[18px] rounded-full bg-black/55 text-white"
                    >
                      <X size={10} />
                    </Button>
                  )}
                </div>
              )}

              {/* Content column */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Book pill — shown when no cover and not cleared */}
                {displayBook && !hasCover && !bookCleared && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-accent text-foreground rounded-md"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.375rem 0.25rem 0.625rem",
                      width: "fit-content",
                    }}
                  >
                    <BookOpen size={12} style={{ flexShrink: 0 }} />
                    <span>
                      {displayBook.title}
                      {displayBook.author && ` · ${displayBook.author}`}
                    </span>
                    {isOwner && isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBookCleared(true)}
                        aria-label="Remove book"
                        className="h-5 w-5 text-muted-foreground"
                      >
                        <X size={12} />
                      </Button>
                    )}
                  </div>
                )}

                {/* Content — textarea in edit mode, text otherwise */}
                {isEditing ? (
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={3}
                      aria-label="Edit post content"
                      autoFocus
                    />

                    {/* Book picker — shown when post has no book (or was cleared) */}
                    {(!post.book && !post.bookTitle) || bookCleared ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        {bookPicker.selectedBook ? (
                          <SelectedBookChip book={bookPicker.selectedBook} onRemove={bookPicker.clear} />
                        ) : bookPicker.bookMode === "search" ? (
                          <BookSearchPanel
                            query={bookPicker.searchQuery}
                            debouncedQuery={bookPicker.debouncedQuery}
                            onQueryChange={bookPicker.setSearchQuery}
                            onSelect={bookPicker.selectBook}
                            onSwitchToManual={() => {
                              bookPicker.openManual();
                              setManualTitle("");
                              setManualAuthor("");
                            }}
                          />
                        ) : bookPicker.bookMode === "manual" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <Input
                                value={manualTitle}
                                onChange={(e) => setManualTitle(e.target.value)}
                                placeholder="Book title"
                                style={{ flex: 1 }}
                              />
                              <Input
                                value={manualAuthor}
                                onChange={(e) => setManualAuthor(e.target.value)}
                                placeholder="Author"
                                style={{ flex: 1 }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-muted-foreground"
                              onClick={() => { bookPicker.openSearch(); setManualTitle(""); setManualAuthor(""); }}
                            >
                              ← Search instead
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={bookPicker.openSearch}
                          >
                            <BookOpen size={13} />
                            + Book
                          </Button>
                        )}
                      </div>
                    ) : null}

                    {/* Spoilers toggle */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5"
                      style={{ width: "fit-content" }}
                    >
                      <Checkbox
                        id={`spoilers-${post.id}`}
                        checked={editHasSpoilers}
                        onCheckedChange={(checked) => setEditHasSpoilers(checked === true)}
                      />
                      <Label
                        htmlFor={`spoilers-${post.id}`}
                        className="text-foreground/60 cursor-pointer select-none"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Spoilers?
                      </Label>
                    </div>
                  </>
                ) : post.hasSpoilers && !spoilerRevealed ? (
                  <div
                    className="bg-muted/50 rounded-md"
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>This post contains spoilers</p>
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
                    <p className="text-foreground" style={{ fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                      {post.content}
                    </p>
                    {post.hasSpoilers && spoilerRevealed && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground mt-1"
                        onClick={(e) => { e.stopPropagation(); setSpoilerRevealed(false); }}
                      >
                        Hide spoiler
                      </Button>
                    )}
                  </div>
                )}

                {/* Book title/author overlay — shown below content when cover is present */}
                {displayBook && hasCover && (
                  <div className="text-muted-foreground" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                    <span className="text-foreground/60" style={{ fontWeight: 500 }}>{displayBook.title}</span>
                    {displayBook.author && ` · ${displayBook.author}`}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* GIF */}
        {post.gifUrl && !isEditing && (
          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={post.gifUrl}
              alt="GIF"
              className="rounded-md"
              style={{ maxWidth: "100%", display: "block" }}
            />
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
            }}
          >
            {/* Like */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={toggleLike.isPending}
              aria-label={post.isLiked ? "Unlike post" : "Like post"}
              className={`gap-1 px-2 h-7 text-xs ${post.isLiked ? "text-primary" : "text-muted-foreground"}`}
            >
              <Heart size={15} fill={post.isLiked ? "currentColor" : "none"} className="flex-shrink-0" />
              <span>{post.likeCount}</span>
            </Button>

            {/* Comment — hidden when comments are disabled */}
            {!post.commentsDisabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => !isDetailView && navigate(`/posts/${post.id}`)}
                aria-label="View comments"
                className="gap-1 px-2 h-7 text-xs text-muted-foreground"
                style={{ cursor: isDetailView ? "default" : "pointer" }}
              >
                <MessageCircle size={15} className="flex-shrink-0" />
                <span>{post.commentCount}</span>
              </Button>
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
