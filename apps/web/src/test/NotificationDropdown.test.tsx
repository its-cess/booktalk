import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseNotifications = vi.hoisted(() => vi.fn());
const mockMarkAllMutate = vi.hoisted(() => vi.fn());
const mockMarkOneMutate = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useNotifications: mockUseNotifications,
  useMarkAllNotificationsRead: () => ({ mutate: mockMarkAllMutate, isPending: false }),
  useMarkNotificationRead: () => ({ mutate: mockMarkOneMutate, isPending: false }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import NotificationDropdown from "@/components/NotificationDropdown";
import type { GroupedNotification } from "@booktalk/shared";

const onClose = vi.fn();

function makeNotif(overrides: Partial<GroupedNotification> = {}): GroupedNotification {
  return {
    id: "notif-1",
    ids: ["notif-1"],
    type: "POST_LIKE",
    postId: "post-1",
    actors: [{ id: "u1", username: "alice", displayName: "Alice" }],
    totalActors: 1,
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("NotificationDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
  });

  it("shows an empty state message when there are no notifications", () => {
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument();
  });

  it("renders a POST_LIKE notification as '<name> liked your post'", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif()], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("Alice liked your post")).toBeInTheDocument();
  });

  it("renders a COMMENT notification as '<name> commented on your post'", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ type: "COMMENT" })], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("Alice commented on your post")).toBeInTheDocument();
  });

  it("renders a MENTION_POST notification as '<name> mentioned you in a post'", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ type: "MENTION_POST" })], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("Alice mentioned you in a post")).toBeInTheDocument();
  });

  it("renders a MENTION_COMMENT notification as '<name> mentioned you in a comment'", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ type: "MENTION_COMMENT" })], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("Alice mentioned you in a comment")).toBeInTheDocument();
  });

  it("shows 'and 2 others' when totalActors is 3", () => {
    mockUseNotifications.mockReturnValue({
      data: {
        notifications: [makeNotif({ totalActors: 3 })],
        unreadCount: 1,
      },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("Alice and 2 others liked your post")).toBeInTheDocument();
  });

  it("shows 'and 1 other' (singular) when totalActors is 2", () => {
    mockUseNotifications.mockReturnValue({
      data: {
        notifications: [makeNotif({ totalActors: 2 })],
        unreadCount: 1,
      },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByText("Alice and 1 other liked your post")).toBeInTheDocument();
  });

  it("shows 'Mark all read' button when there are unread notifications", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ read: false })], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.getByRole("button", { name: /mark all read/i })).toBeInTheDocument();
  });

  it("hides 'Mark all read' button when all notifications are read", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ read: true })], unreadCount: 0 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    expect(screen.queryByRole("button", { name: /mark all read/i })).not.toBeInTheDocument();
  });

  it("clicking 'Mark all read' calls the mutation", async () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif()], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /mark all read/i }));
    expect(mockMarkAllMutate).toHaveBeenCalledOnce();
  });

  it("clicking a notification marks it read, calls onClose, and navigates to the post", async () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ id: "notif-1", postId: "post-42" })], unreadCount: 1 },
    });
    render(<NotificationDropdown onClose={onClose} />);
    await userEvent.click(screen.getByText("Alice liked your post"));
    expect(mockMarkOneMutate).toHaveBeenCalledWith("notif-1");
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/posts/post-42");
  });

  it("unread notification has a visible dot indicator", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ read: false })], unreadCount: 1 },
    });
    const { container } = render(<NotificationDropdown onClose={onClose} />);
    // The unread dot has backgroundColor #4338ca (indigo)
    const dot = container.querySelector('span[style*="4338ca"]');
    expect(dot).toBeInTheDocument();
  });

  it("read notification has a transparent dot indicator", () => {
    mockUseNotifications.mockReturnValue({
      data: { notifications: [makeNotif({ read: true })], unreadCount: 0 },
    });
    const { container } = render(<NotificationDropdown onClose={onClose} />);
    const dot = container.querySelector('span[style*="transparent"]');
    expect(dot).toBeInTheDocument();
  });
});
