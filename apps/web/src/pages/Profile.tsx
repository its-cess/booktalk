import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Camera, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useProfile, useUpdateProfile, useToggleFollow, useUploadAvatar } from "@/lib/queries";
import PostCard from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const { data: profile, isLoading, isError } = useProfile(username!);
  const updateProfile = useUpdateProfile();
  const toggleFollow = useToggleFollow();
  const uploadAvatar = useUploadAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwn = me?.username === username;

  const [editingField, setEditingField] = useState<"displayName" | "bio" | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(field: "displayName" | "bio", current: string) {
    setEditingField(field);
    setEditValue(current ?? "");
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  async function saveEdit() {
    if (!editingField) return;
    try {
      await updateProfile.mutateAsync({ [editingField]: editValue });
      setEditingField(null);
    } catch {
      toast.error("Failed to save changes.");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar.");
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleFollow() {
    try {
      await toggleFollow.mutateAsync(username!);
    } catch {
      toast.error("Failed to update follow status.");
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground" style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
        Loading…
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-destructive" style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
        User not found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Profile header */}
      <div
        className="bg-background rounded-sm"
        style={{
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Avatar + names row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              className="bg-primary/10 text-primary rounded-full"
              style={{
                width: "4rem",
                height: "4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                overflow: "hidden",
              }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                profile.displayName[0].toUpperCase()
              )}
            </div>
            {isOwn && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                  aria-label="Change avatar"
                  className="bg-background text-muted-foreground hover:text-foreground rounded-full"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "1.5rem",
                    height: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid hsl(var(--border))",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Camera size={11} />
                </button>
              </>
            )}
          </div>

          {/* Names + stats */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Display name row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
              {editingField === "displayName" ? (
                <InlineEdit
                  value={editValue}
                  onChange={setEditValue}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  isPending={updateProfile.isPending}
                  inputStyle={{ fontSize: "1.125rem", fontWeight: 700 }}
                />
              ) : (
                <>
                  <span className="text-foreground" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                    {profile.displayName}
                  </span>
                  {isOwn && (
                    <EditIconBtn onClick={() => startEdit("displayName", profile.displayName)} />
                  )}
                </>
              )}
            </div>

            <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>@{profile.username}</span>

            {/* Follower / following counts */}
            <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.75rem" }}>
              <Link
                to={`/${username}/followers`}
                style={{ textDecoration: "none" }}
              >
                <Stat count={profile.followersCount} label="followers" />
              </Link>
              <Link
                to={`/${username}/following`}
                style={{ textDecoration: "none" }}
              >
                <Stat count={profile.followingCount} label="following" />
              </Link>
            </div>
          </div>

          {/* Follow / Unfollow button for other users */}
          {!isOwn && me && (
            <Button
              variant={profile.isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
              style={{ flexShrink: 0 }}
            >
              {profile.isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
        </div>

        {/* Bio */}
        <div>
          {editingField === "bio" ? (
            <InlineEdit
              value={editValue}
              onChange={setEditValue}
              onSave={saveEdit}
              onCancel={cancelEdit}
              isPending={updateProfile.isPending}
              multiline
            />
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: profile.bio ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {profile.bio ?? (isOwn ? "Add a bio…" : "")}
              </p>
              {isOwn && (
                <EditIconBtn onClick={() => startEdit("bio", profile.bio ?? "")} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', marginBottom: "1rem" }}>
          Posts
        </h2>
        {profile.posts.length === 0 ? (
          <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>No posts yet.</p>
        ) : (
          profile.posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                authorDisplayName: post.author.displayName,
                authorUsername: post.author.username,
                authorAvatarUrl: post.author.avatarUrl,
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
              isOwner={isOwn}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="text-foreground/60"
      style={{ fontSize: "0.875rem" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
    >
      <strong className="text-foreground">{count}</strong> {label}
    </span>
  );
}

function EditIconBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Edit"
      className="h-6 w-6 text-muted-foreground flex-shrink-0"
    >
      <Pencil size={13} />
    </Button>
  );
}

function InlineEdit({
  value,
  onChange,
  onSave,
  onCancel,
  isPending,
  multiline = false,
  inputStyle = {},
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  multiline?: boolean;
  inputStyle?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", width: "100%" }}>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          autoFocus
          className="flex-1 text-sm"
          style={inputStyle}
        />
      ) : (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className="flex-1"
          style={inputStyle}
        />
      )}
      <div style={{ display: "flex", gap: "0.25rem", paddingTop: "0.25rem" }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          disabled={isPending || !value.trim()}
          aria-label="Save changes"
          className="text-primary"
          style={{ width: "1.75rem", height: "1.75rem" }}
        >
          <Check size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isPending}
          aria-label="Discard changes"
          className="text-destructive"
          style={{ width: "1.75rem", height: "1.75rem" }}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
