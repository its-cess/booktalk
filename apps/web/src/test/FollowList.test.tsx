import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseFollowList = vi.hoisted(() => vi.fn());
const mockUseToggleFollow = vi.hoisted(() => vi.fn());
const mockFollowMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => ({ value: "/alice/followers" }));

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/queries", () => ({
  useFollowList: mockUseFollowList,
  useToggleFollow: mockUseToggleFollow,
}));
vi.mock("sonner", () => ({ toast: { error: mockToastError } }));
vi.mock("react-router-dom", () => ({
  useParams: () => ({ username: "alice" }),
  useLocation: () => ({ pathname: mockPathname.value }),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
}));

import FollowList from "@/pages/FollowList";

const MOCK_USERS = [
  { id: "user-2", username: "bob", displayName: "Bob Smith", avatarUrl: null, isFollowing: true },
  { id: "user-3", username: "carol", displayName: "Carol Jones", avatarUrl: null, isFollowing: false },
];

describe("FollowList — loading / error states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.value = "/alice/followers";
    mockUseAuth.mockReturnValue({ user: { id: "user-1", username: "alice" } });
    mockUseToggleFollow.mockReturnValue({ mutateAsync: mockFollowMutateAsync, isPending: false });
  });

  it("shows loading state", () => {
    mockUseFollowList.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<FollowList />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseFollowList.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<FollowList />);
    expect(screen.getByText(/failed to load followers/i)).toBeInTheDocument();
  });

  it("shows empty state for followers", () => {
    mockUseFollowList.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<FollowList />);
    expect(screen.getByText("No followers yet.")).toBeInTheDocument();
  });

  it("shows empty state for following", () => {
    mockPathname.value = "/alice/following";
    mockUseFollowList.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<FollowList />);
    expect(screen.getByText("Not following anyone yet.")).toBeInTheDocument();
  });
});

describe("FollowList — followers page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.value = "/alice/followers";
    mockUseAuth.mockReturnValue({ user: { id: "user-1", username: "alice" } });
    mockUseFollowList.mockReturnValue({ data: MOCK_USERS, isLoading: false, isError: false });
    mockUseToggleFollow.mockReturnValue({ mutateAsync: mockFollowMutateAsync, isPending: false });
  });

  it("shows the Followers heading", () => {
    render(<FollowList />);
    expect(screen.getByRole("heading", { name: "Followers" })).toBeInTheDocument();
  });

  it("renders a row for each user", () => {
    render(<FollowList />);
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Carol Jones")).toBeInTheDocument();
    expect(screen.getByText("@carol")).toBeInTheDocument();
  });

  it("renders user rows as links to their profiles", () => {
    render(<FollowList />);
    const bobLinks = screen.getAllByRole("link", { name: /bob/i });
    expect(bobLinks[0]).toHaveAttribute("href", "/bob");
  });

  it("does not show Unfollow buttons on followers page (own profile)", () => {
    render(<FollowList />);
    expect(screen.queryByRole("button", { name: /unfollow/i })).not.toBeInTheDocument();
  });

  it("shows a back link to the profile", () => {
    render(<FollowList />);
    const backLink = screen.getByRole("link", { name: /← @alice/i });
    expect(backLink).toHaveAttribute("href", "/alice");
  });

  it("passes correct type to useFollowList", () => {
    render(<FollowList />);
    expect(mockUseFollowList).toHaveBeenCalledWith("alice", "followers");
  });
});

describe("FollowList — following page (own profile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.value = "/alice/following";
    mockUseAuth.mockReturnValue({ user: { id: "user-1", username: "alice" } });
    mockUseFollowList.mockReturnValue({ data: MOCK_USERS, isLoading: false, isError: false });
    mockUseToggleFollow.mockReturnValue({ mutateAsync: mockFollowMutateAsync, isPending: false });
  });

  it("shows the Following heading", () => {
    render(<FollowList />);
    expect(screen.getByRole("heading", { name: "Following" })).toBeInTheDocument();
  });

  it("shows Unfollow buttons for each user on own following list", () => {
    render(<FollowList />);
    const unfollowBtns = screen.getAllByRole("button", { name: "Unfollow" });
    expect(unfollowBtns).toHaveLength(2);
  });

  it("calls mutateAsync with the username when Unfollow is clicked", async () => {
    mockFollowMutateAsync.mockResolvedValueOnce({ isFollowing: false });
    render(<FollowList />);
    const [firstUnfollow] = screen.getAllByRole("button", { name: "Unfollow" });
    await userEvent.click(firstUnfollow);
    await waitFor(() => {
      expect(mockFollowMutateAsync).toHaveBeenCalledWith("bob");
    });
  });

  it("shows an error toast when unfollow fails", async () => {
    mockFollowMutateAsync.mockRejectedValueOnce(new Error("Network error"));
    render(<FollowList />);
    const [firstUnfollow] = screen.getAllByRole("button", { name: "Unfollow" });
    await userEvent.click(firstUnfollow);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to unfollow.");
    });
  });

  it("passes correct type to useFollowList", () => {
    render(<FollowList />);
    expect(mockUseFollowList).toHaveBeenCalledWith("alice", "following");
  });
});

describe("FollowList — following page (other user's profile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.value = "/alice/following";
    mockUseAuth.mockReturnValue({ user: { id: "user-2", username: "bob" } });
    mockUseFollowList.mockReturnValue({ data: MOCK_USERS, isLoading: false, isError: false });
    mockUseToggleFollow.mockReturnValue({ mutateAsync: mockFollowMutateAsync, isPending: false });
  });

  it("does not show Unfollow buttons when viewing someone else's following list", () => {
    render(<FollowList />);
    expect(screen.queryByRole("button", { name: /unfollow/i })).not.toBeInTheDocument();
  });
});
