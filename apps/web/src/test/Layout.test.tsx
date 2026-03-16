import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));

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
    expect(screen.queryByRole("link", { name: "Notifications" })).not.toBeInTheDocument();
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
  });

  it("shows the Home icon linking to /", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("shows the Profile icon linking to the user's profile", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/alice");
  });

  it("shows the Notifications icon linking to /notifications", () => {
    render(<Layout />);
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("href", "/notifications");
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
