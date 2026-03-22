import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/lib/queries";
import type { GroupedNotification } from "@booktalk/shared";
import { Button } from "@/components/ui/button";

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
      className="bg-background border border-border rounded-lg"
      style={{
        position: "absolute",
        top: "calc(100% + 0.5rem)",
        right: 0,
        zIndex: 100,
        width: "320px",
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
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <span className="text-foreground" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Notifications
        </span>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="h-auto gap-1 p-0 text-xs text-primary"
          >
            <Check size={13} />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <p
            className="text-muted-foreground"
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            No notifications yet.
          </p>
        ) : (
          notifications.map((n) => (
            <Button
              key={n.id}
              variant="ghost"
              onClick={() => handleClick(n)}
              className="w-full justify-start items-start gap-2.5 rounded-none border-b px-4 py-3 h-auto"
              style={{
                backgroundColor: n.read ? undefined : "hsl(var(--primary) / 0.05)",
                borderColor: "hsl(var(--muted))",
              }}
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
                  backgroundColor: n.read ? "transparent" : "hsl(var(--primary))",
                }}
              />
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p
                  className="text-foreground"
                  style={{
                    fontSize: "0.85rem",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {notificationText(n)}
                </p>
                <span className="text-muted-foreground" style={{ fontSize: "0.72rem" }}>
                  {formatTimeAgo(n.createdAt)}
                </span>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
