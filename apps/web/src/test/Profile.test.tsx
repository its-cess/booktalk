import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseProfile = vi.hoisted(() => vi.fn());
const mockUseUpdateProfile = vi.hoisted(() => vi.fn());
const mockUpdateMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/queries", () => ({
  useProfile: mockUseProfile,
  useUpdateProfile: mockUseUpdateProfile,
}));
vi.mock("sonner", () => ({ toast: { error: mockToastError } }));
vi.mock("react-router-dom", () => ({
  useParams: () => ({ username: "alice" }),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/post/PostCard", () => ({
  default: ({ post }: { post: { content: string } }) => (
    <div data-testid="post-card">{post.content}</div>
  ),
}));

import Profile from "@/pages/Profile";

const MOCK_POST = {
  id: "post-1",
  content: "Just finished Dune!",
  bookTitle: null,
  bookAuthor: null,
  hasSpoilers: false,
  createdAt: new Date().toISOString(),
  author: { id: "user-1", username: "alice", displayName: "Alice Wonder" },
};

const MOCK_PROFILE = {
  id: "user-1",
  username: "alice",
  displayName: "Alice Wonder",
  bio: "I love books!",
  avatarUrl: null,
  createdAt: new Date().toISOString(),
  followersCount: 12,
  followingCount: 5,
  posts: [MOCK_POST],
};

describe("Profile — loading / error states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-2", username: "bob" } });
    mockUseUpdateProfile.mockReturnValue({ mutateAsync: mockUpdateMutateAsync, isPending: false });
  });

  it("shows the loading state", () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Profile />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an error when the user is not found", () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Profile />);
    expect(screen.getByText("User not found.")).toBeInTheDocument();
  });
});

describe("Profile — viewing another user's profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-2", username: "bob" } });
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    mockUseUpdateProfile.mockReturnValue({ mutateAsync: mockUpdateMutateAsync, isPending: false });
  });

  it("shows the display name, username, and bio", () => {
    render(<Profile />);
    expect(screen.getByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("I love books!")).toBeInTheDocument();
  });

  it("shows follower and following counts", () => {
    render(<Profile />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/followers/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/following/)).toBeInTheDocument();
  });

  it("renders a PostCard for each post", () => {
    render(<Profile />);
    expect(screen.getAllByTestId("post-card")).toHaveLength(1);
    expect(screen.getByText("Just finished Dune!")).toBeInTheDocument();
  });

  it("shows empty state when there are no posts", () => {
    mockUseProfile.mockReturnValue({
      data: { ...MOCK_PROFILE, posts: [] },
      isLoading: false,
      isError: false,
    });
    render(<Profile />);
    expect(screen.getByText("No posts yet.")).toBeInTheDocument();
  });

  it("does not show edit buttons", () => {
    render(<Profile />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});

describe("Profile — own profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-1", username: "alice" } });
    mockUseProfile.mockReturnValue({ data: MOCK_PROFILE, isLoading: false, isError: false });
    mockUseUpdateProfile.mockReturnValue({ mutateAsync: mockUpdateMutateAsync, isPending: false });
  });

  it("shows edit buttons for display name and bio", () => {
    render(<Profile />);
    const editBtns = screen.getAllByRole("button", { name: "Edit" });
    expect(editBtns).toHaveLength(2);
  });

  it("switches display name to an input when the edit button is clicked", async () => {
    render(<Profile />);
    const [editDisplayName] = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editDisplayName);

    expect(screen.getByRole("textbox")).toHaveValue("Alice Wonder");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeInTheDocument();
  });

  it("discards changes and returns to view mode when Discard is clicked", async () => {
    render(<Profile />);
    const [editDisplayName] = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editDisplayName);

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Alice Wonder")).toBeInTheDocument();
  });

  it("calls mutateAsync with updated display name and exits edit mode on success", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ ...MOCK_PROFILE, displayName: "Alice W." });
    render(<Profile />);
    const [editDisplayName] = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editDisplayName);

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Alice W.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({ displayName: "Alice W." });
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  it("shows an error toast and stays in edit mode when saving fails", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<Profile />);
    const [editDisplayName] = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editDisplayName);

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to save changes.");
    });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("switches bio to a textarea when the bio edit button is clicked", async () => {
    render(<Profile />);
    const [, editBio] = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editBio);

    expect(screen.getByRole("textbox")).toHaveValue("I love books!");
  });

  it("calls mutateAsync with updated bio on save", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ ...MOCK_PROFILE, bio: "New bio" });
    render(<Profile />);
    const [, editBio] = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editBio);

    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "New bio");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({ bio: "New bio" });
    });
  });
});
