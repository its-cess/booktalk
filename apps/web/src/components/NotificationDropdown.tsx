import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/lib/queries";
import type { GroupedNotification } from "@booktalk/shared";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function notificationText(n: GroupedNotification): string {
  const firstName =
    n.actors[0]?.displayName || `@${n.actors[0]?.username}` || "Someone";
  const others = n.totalActors - 1;
  const othersText = others > 0 ? ` and ${others} other${others > 1 ? "s" : ""}` : "";
  const actor = `${firstName}${othersText}`;

  switch (n.type) {
    case "POST_LIKE":
      return `${actor} liked your post`;
    case "COMMENT":
      return `${actor} commented on your post`;
    case "MENTION_POST":
      return `${actor} mentioned you in a post`;
    case "MENTION_COMMENT":
      return `${actor} mentioned you in a comment`;
  }
}

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const navigate = useNavigate();
  const { data } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const notifications = data?.notifications ?? [];

  function handleClick(n: GroupedNotification) {
    markOne.mutate(n.id);
    onClose();
    navigate(`/posts/${n.postId}`);
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 0.5rem)",
        right: 0,
        zIndex: 100,
        width: "320px",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: "0.75rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#171717" }}>
          Notifications
        </span>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              color: "#4338ca",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Check size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <p
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#a3a3a3",
            }}
          >
            No notifications yet.
          </p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
                width: "100%",
                padding: "0.75rem 1rem",
                background: n.read ? "none" : "#f5f3ff",
                border: "none",
                borderBottom: "1px solid #f5f5f5",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = n.read
                  ? "#fafafa"
                  : "#ede9fe")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = n.read
                  ? "transparent"
                  : "#f5f3ff")
              }
            >
              {/* Unread dot */}
              <span
                data-testid={n.read ? undefined : "unread-dot"}
                style={{
                  flexShrink: 0,
                  marginTop: "0.35rem",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: n.read ? "transparent" : "#4338ca",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#171717",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {notificationText(n)}
                </p>
                <span style={{ fontSize: "0.72rem", color: "#a3a3a3" }}>
                  {formatTimeAgo(n.createdAt)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
