import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useProfile, useUpdateProfile, useToggleFollow } from "@/lib/queries";
import PostCard from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const { data: profile, isLoading, isError } = useProfile(username!);
  const updateProfile = useUpdateProfile();
  const toggleFollow = useToggleFollow();

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

  async function handleFollow() {
    try {
      await toggleFollow.mutateAsync(username!);
    } catch {
      toast.error("Failed to update follow status.");
    }
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem", color: "#737373" }}>
        Loading…
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem", color: "#ef4444" }}>
        User not found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Profile header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e5e5",
          borderRadius: "0.75rem",
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
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              backgroundColor: "#e0e7ff",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {profile.displayName[0].toUpperCase()}
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
                  <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#171717" }}>
                    {profile.displayName}
                  </span>
                  {isOwn && (
                    <EditIconBtn onClick={() => startEdit("displayName", profile.displayName)} />
                  )}
                </>
              )}
            </div>

            <span style={{ fontSize: "0.875rem", color: "#737373" }}>@{profile.username}</span>

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
                  color: profile.bio ? "#262626" : "#a3a3a3",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#171717", margin: 0 }}>
          Posts
        </h2>
        {profile.posts.length === 0 ? (
          <p style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>No posts yet.</p>
        ) : (
          profile.posts.map((post) => (
            <PostCard
              key={post.id}
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
      style={{ fontSize: "0.875rem", color: "#525252" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#525252")}
    >
      <strong style={{ color: "#171717" }}>{count}</strong> {label}
    </span>
  );
}

function EditIconBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Edit"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#a3a3a3",
        padding: "0.125rem",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#a3a3a3")}
    >
      <Pencil size={13} />
    </button>
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
  const baseInputStyle: React.CSSProperties = {
    flex: 1,
    border: "1px solid #a3a3a3",
    borderRadius: "0.375rem",
    padding: "0.25rem 0.5rem",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    color: "#171717",
    outline: "none",
    resize: "vertical",
    ...inputStyle,
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", width: "100%" }}>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          autoFocus
          style={baseInputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#4338ca")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#a3a3a3")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          style={baseInputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#4338ca")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#a3a3a3")}
        />
      )}
      <div style={{ display: "flex", gap: "0.25rem", paddingTop: "0.25rem" }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          disabled={isPending || !value.trim()}
          aria-label="Save changes"
          style={{ width: "1.75rem", height: "1.75rem", color: "#16a34a" }}
        >
          <Check size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isPending}
          aria-label="Discard changes"
          style={{ width: "1.75rem", height: "1.75rem", color: "#737373" }}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
