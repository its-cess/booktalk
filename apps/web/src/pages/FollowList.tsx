import { useParams, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useFollowList, useToggleFollow } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import type { UserSummary } from "@booktalk/shared";

export default function FollowList() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const type: "followers" | "following" = location.pathname.endsWith("/following")
    ? "following"
    : "followers";
  const { user: me } = useAuth();
  const { data: users, isLoading, isError } = useFollowList(username!, type);

  const isOwnList = me?.username === username;
  const title = type === "followers" ? "Followers" : "Following";

  if (isLoading) {
    return (
      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem", color: "#737373" }}>
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem", color: "#ef4444" }}>
        Failed to load {title.toLowerCase()}.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <Link
          to={`/${username}`}
          style={{ fontSize: "0.875rem", color: "#737373", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
        >
          ← @{username}
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#171717", margin: "0.5rem 0 0" }}>
          {title}
        </h1>
      </div>

      {users?.length === 0 ? (
        <p style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
          {type === "followers" ? "No followers yet." : "Not following anyone yet."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {users?.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              showUnfollow={isOwnList && type === "following"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, showUnfollow }: { user: UserSummary; showUnfollow: boolean }) {
  const toggleFollow = useToggleFollow();

  async function handleUnfollow() {
    try {
      await toggleFollow.mutateAsync(user.username);
    } catch {
      toast.error("Failed to unfollow.");
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: "0.75rem",
        padding: "0.875rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      {/* Avatar */}
      <Link to={`/${user.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            backgroundColor: "#e0e7ff",
            color: "#4338ca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          {user.displayName[0].toUpperCase()}
        </div>
      </Link>

      {/* Names */}
      <Link
        to={`/${user.username}`}
        style={{ textDecoration: "none", flex: 1, minWidth: 0 }}
      >
        <div style={{ fontWeight: 600, color: "#171717", fontSize: "0.9rem", lineHeight: 1.3 }}>
          {user.displayName}
        </div>
        <div style={{ color: "#737373", fontSize: "0.8rem" }}>@{user.username}</div>
      </Link>

      {/* Unfollow button */}
      {showUnfollow && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnfollow}
          disabled={toggleFollow.isPending}
          style={{ flexShrink: 0 }}
        >
          Unfollow
        </Button>
      )}
    </div>
  );
}
