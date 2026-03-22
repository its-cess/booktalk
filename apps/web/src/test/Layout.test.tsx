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

// Stub out the notification panel so Layout tests stay focused on the bell itself
vi.mock("@/components/NotificationDropdown", () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="notification-dropdown">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

// Stub Sheet to avoid Radix portal/dialog issues in jsdom
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: { open?: boolean; children: React.ReactNode }) =>
    open ? <>{children}</> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
  Outlet: () => null,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import Layout from "@/components/Layout";

describe("Layout header — unauthenticated", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, logout: mockLogout });
    mockUseNotifications.mockReturnValue({ data: undefined });
  });

  it("shows the BookTalk logo linking to /", () => {
    render(<Layout />);
    expect(screen.getAllByRole("link", { name: /booktalk/i })[0]).toHaveAttribute("href", "/");
  });

  it("shows the Log in link that navigates to /login", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("does not show authenticated nav items", () => {
    render(<Layout />);
    expect(screen.queryByTestId("notifications-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("logout-button")).not.toBeInTheDocument();
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

  it("shows the Home link pointing to /", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });

  it("shows the Profile link pointing to the user's profile", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/alice");
  });

  it("shows the Notifications bell as a button (not a link)", () => {
    render(<Layout />);
    expect(screen.getByTestId("notifications-toggle")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /notifications/i })).not.toBeInTheDocument();
  });

  it("shows the Log out button and calls logout when clicked", async () => {
    render(<Layout />);
    await userEvent.click(screen.getByTestId("logout-button"));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it("does not show the Log in link", () => {
    render(<Layout />);
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
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
    render(<Layout />);
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
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

  it("clicking the bell opens the notification panel", async () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
    render(<Layout />);
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("notifications-toggle"));
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
  });

  it("clicking the bell again closes the notification panel", async () => {
    mockUseNotifications.mockReturnValue({ data: { notifications: [], unreadCount: 0 } });
    render(<Layout />);
    await userEvent.click(screen.getByTestId("notifications-toggle"));
    await userEvent.click(screen.getByTestId("notifications-toggle"));
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
  });
});
