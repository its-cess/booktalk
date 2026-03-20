import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUpdateMutateAsync = vi.hoisted(() => vi.fn());
const mockDeleteMutateAsync = vi.hoisted(() => vi.fn());
const mockToggleLikeMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useUpdateComment: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
  useDeleteComment: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
  useToggleCommentLike: () => ({ mutateAsync: mockToggleLikeMutateAsync, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
}));

import CommentCard from "@/components/post/CommentCard";
import type { CommentWithAuthor } from "@booktalk/shared";

const MOCK_COMMENT: CommentWithAuthor = {
  id: "comment-1",
  content: "Great review!",
  gifUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: {
    id: "user-2",
    username: "bob",
    displayName: "Bob",
  },
  likeCount: 0,
  isLiked: false,
};

const DEFAULT_PROPS = {
  comment: MOCK_COMMENT,
  postId: "post-1",
  isOwner: false,
  isPostOwner: false,
};

async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: "Comment options" }));
}

describe("CommentCard — display", () => {
  it("renders the author display name and handle", () => {
    render(<CommentCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  it("renders the comment content", () => {
    render(<CommentCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Great review!")).toBeInTheDocument();
  });

  it("shows the like count", () => {
    render(<CommentCard {...DEFAULT_PROPS} comment={{ ...MOCK_COMMENT, likeCount: 5 }} />);
    expect(screen.getByRole("button", { name: "Like comment" })).toHaveTextContent("5");
  });

  it("shows 'Unlike comment' aria-label when already liked", () => {
    render(<CommentCard {...DEFAULT_PROPS} comment={{ ...MOCK_COMMENT, isLiked: true }} />);
    expect(screen.getByRole("button", { name: "Unlike comment" })).toBeInTheDocument();
  });

  it("shows 'Like comment' aria-label when not liked", () => {
    render(<CommentCard {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: "Like comment" })).toBeInTheDocument();
  });

  it("does not show the options menu when not owner or post owner", () => {
    render(<CommentCard {...DEFAULT_PROPS} />);
    expect(screen.queryByRole("button", { name: "Comment options" })).not.toBeInTheDocument();
  });

  it("shows the options menu when isOwner is true", () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    expect(screen.getByRole("button", { name: "Comment options" })).toBeInTheDocument();
  });

  it("shows the options menu when isPostOwner is true", () => {
    render(<CommentCard {...DEFAULT_PROPS} isPostOwner />);
    expect(screen.getByRole("button", { name: "Comment options" })).toBeInTheDocument();
  });
});

describe("CommentCard — like", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls toggleLike with the comment id when liked", async () => {
    mockToggleLikeMutateAsync.mockResolvedValueOnce({ isLiked: true });
    render(<CommentCard {...DEFAULT_PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: "Like comment" }));
    expect(mockToggleLikeMutateAsync).toHaveBeenCalledWith("comment-1");
  });

  it("shows an error toast when liking fails", async () => {
    mockToggleLikeMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<CommentCard {...DEFAULT_PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: "Like comment" }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to like comment.");
    });
  });
});

describe("CommentCard — edit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the Edit comment option only when isOwner", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    expect(screen.getByRole("menuitem", { name: /edit comment/i })).toBeInTheDocument();
  });

  it("does not show Edit comment for post owner who is not comment owner", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isPostOwner />);
    await openMenu();
    expect(screen.queryByRole("menuitem", { name: /edit comment/i })).not.toBeInTheDocument();
  });

  it("switches to edit mode when Edit comment is clicked", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit comment/i }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save comment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeInTheDocument();
  });

  it("pre-fills the textarea with the current comment content", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit comment/i }));

    expect(screen.getByRole("textbox")).toHaveValue("Great review!");
  });

  it("discards changes and returns to view mode when X is clicked", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit comment/i }));

    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Changed my mind");
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Great review!")).toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("disables the save button when textarea is empty", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit comment/i }));

    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);

    expect(screen.getByRole("button", { name: "Save comment" })).toBeDisabled();
  });

  it("calls mutateAsync with updated content and exits edit mode on success", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ ...MOCK_COMMENT, content: "Updated!" });
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit comment/i }));

    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated!");
    await userEvent.click(screen.getByRole("button", { name: "Save comment" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        commentId: "comment-1",
        content: "Updated!",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  it("shows an error toast when saving fails", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit comment/i }));
    await userEvent.click(screen.getByRole("button", { name: "Save comment" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to save comment.");
    });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("CommentCard — delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Delete comment for the comment owner", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    expect(screen.getByRole("menuitem", { name: /delete comment/i })).toBeInTheDocument();
  });

  it("shows Delete comment for the post owner", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isPostOwner />);
    await openMenu();
    expect(screen.getByRole("menuitem", { name: /delete comment/i })).toBeInTheDocument();
  });

  it("opens the confirmation dialog when Delete comment is clicked", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete comment/i }));

    expect(screen.getByRole("heading", { name: "Delete comment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete comment/i }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("heading", { name: "Delete comment" })).not.toBeInTheDocument();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it("calls mutateAsync with the comment id and closes the dialog on success", async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({});
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete comment/i }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockDeleteMutateAsync).toHaveBeenCalledWith("comment-1"));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Delete comment" })).not.toBeInTheDocument();
    });
  });

  it("shows an error toast when deletion fails", async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<CommentCard {...DEFAULT_PROPS} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete comment/i }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete comment.");
    });
  });
});
