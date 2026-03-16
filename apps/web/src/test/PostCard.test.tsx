import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useDeletePost: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

import PostCard from "@/components/post/PostCard";

const MOCK_POST = {
  id: "post-1",
  authorDisplayName: "Alice",
  authorUsername: "alice",
  content: "Just finished Dune!",
  hasSpoilers: false,
  createdAt: new Date().toISOString(),
};

describe("PostCard — delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not show the delete button when isOwner is false", () => {
    render(<PostCard post={MOCK_POST} />);
    expect(screen.queryByRole("button", { name: "Delete post" })).not.toBeInTheDocument();
  });

  it("shows the delete button when isOwner is true", () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    expect(screen.getByRole("button", { name: "Delete post" })).toBeInTheDocument();
  });

  it("opens the confirmation dialog when the delete button is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));

    expect(screen.getByRole("heading", { name: "Delete post" })).toBeInTheDocument();
    expect(screen.getByText(/can't be undone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("closes the dialog when the overlay is clicked", async () => {
    const { container } = render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));

    // Click the fixed overlay (the portal's outermost div, rendered in document.body)
    const overlay = document.body.querySelector<HTMLElement>("[style*='rgba(0, 0, 0']");
    expect(overlay).not.toBeNull();
    await userEvent.click(overlay!);

    expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    // suppress unused warning
    void container;
  });

  it("calls mutateAsync with the post id and closes the dialog on success", async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={MOCK_POST} isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith("post-1");
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    });
  });

  it("shows an error toast and keeps the dialog open when deletion fails", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<PostCard post={MOCK_POST} isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete post.");
    });
  });
});
