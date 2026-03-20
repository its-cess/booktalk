import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());
const mockUseNotifications = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));

vi.mock("@/lib/queries", () => ({
  useNotifications: mockUseNotifications,
}));

// Stub out the dropdown so Layout tests stay focused on the bell itself
vi.mock("@/components/NotificationDropdown", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="notification-dropdown">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
  Outlet: () => null,
}));

import Layout from "@/components/Layout";

describe("Layout header — unauthenticated", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, logout: mockLogout });
    mockUseNotifications.mockReturnValue({ data: undefined });
  });

  it("shows the BookTalk logo linking to /", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: /booktalk/i })).toHaveAttribute("href", "/");
  });

  it("shows the Log in icon linking to /login", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("does not show authenticated icons", () => {
    render(<Layout />);
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });
});

describe("Layout header — authenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", username: "alice" },
      isAuthenticated: true,
      logout: mockLogout,
    });
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
  });

  it("shows the Home icon linking to /", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("shows the Profile icon linking to the user's profile", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/alice");
  });

  it("shows the Notifications bell as a button (not a link)", () => {
    render(<Layout />);
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Notifications" })).not.toBeInTheDocument();
  });

  it("shows the Log out button and calls logout when clicked", async () => {
    render(<Layout />);
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it("does not show the Log in icon", () => {
    render(<Layout />);
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });
});

describe("Layout notification bell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", username: "alice" },
      isAuthenticated: true,
      logout: mockLogout,
    });
  });

  it("does not show a badge when unread count is 0", () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
    const { container } = render(<Layout />);
    // Badge is a span with backgroundColor #ef4444 — should not be present
    expect(container.querySelector('span[style*="ef4444"]')).not.toBeInTheDocument();
  });

  it("shows a badge with the unread count when unreadCount > 0", () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 3 } });
    render(<Layout />);
    const badge = screen.getByTestId("notification-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("3");
  });

  it("shows '9+' in the badge when unreadCount exceeds 9", () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 12 } });
    render(<Layout />);
    expect(screen.getByTestId("notification-badge")).toHaveTextContent("9+");
  });

  it("clicking the bell opens the notification dropdown", async () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
    render(<Layout />);
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
  });

  it("clicking the bell again closes the dropdown", async () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
    render(<Layout />);
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
  });
});
