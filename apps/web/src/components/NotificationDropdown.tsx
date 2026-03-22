import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
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
  onClose?: () => void;
}

export default function NotificationPanel({ onClose }: Props) {
  const navigate = useNavigate();
  const { data } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const notifications = data?.notifications ?? [];

  function handleClick(n: GroupedNotification) {
    markOne.mutate(n.id);
    onClose?.();
    navigate(`/posts/${n.postId}`);
  }

  return (
    <div
      className="bg-background"
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Header row — mark all read + optional close */}
      {(notifications.some((n) => !n.read) || onClose) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 0.875rem",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          {notifications.some((n) => !n.read) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="h-auto gap-1 p-0 text-xs text-primary"
            >
              <Check size={12} />
              Mark all read
            </Button>
          ) : (
            <span />
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.125rem", display: "flex" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <p
            className="text-muted-foreground"
            style={{
              padding: "1.5rem 1rem",
              textAlign: "center",
              fontSize: "0.8rem",
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
              className="w-full justify-start items-start gap-2 rounded-none border-b border-border px-3 py-2.5 h-auto"
              style={{
                backgroundColor: n.read ? "hsl(57 80% 96%)" : "hsl(var(--primary) / 0.05)",
              }}
            >
              <span
                data-testid={n.read ? undefined : "unread-dot"}
                style={{
                  flexShrink: 0,
                  marginTop: "0.3rem",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: n.read ? "transparent" : "hsl(var(--primary))",
                }}
              />
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p
                  className="text-foreground"
                  style={{ fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}
                >
                  {notificationText(n)}
                </p>
                <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
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
