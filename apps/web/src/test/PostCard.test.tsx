import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockDeleteMutateAsync = vi.hoisted(() => vi.fn());
const mockUpdateMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useDeletePost: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
  useUpdatePost: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
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
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it("closes the dialog when the overlay is clicked", async () => {
    const { container } = render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));

    const overlay = document.body.querySelector<HTMLElement>("[style*='rgba(0, 0, 0']");
    expect(overlay).not.toBeNull();
    await userEvent.click(overlay!);

    expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    void container;
  });

  it("calls mutateAsync with the post id and closes the dialog on success", async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={MOCK_POST} isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockDeleteMutateAsync).toHaveBeenCalledWith("post-1"));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    });
  });

  it("shows an error toast when deletion fails", async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<PostCard post={MOCK_POST} isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Delete post" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete post.");
    });
  });
});

describe("PostCard — edit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not show the edit button when isOwner is false", () => {
    render(<PostCard post={MOCK_POST} />);
    expect(screen.queryByRole("button", { name: "Edit post" })).not.toBeInTheDocument();
  });

  it("shows the edit button when isOwner is true", () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    expect(screen.getByRole("button", { name: "Edit post" })).toBeInTheDocument();
  });

  it("switches to edit mode when the pencil button is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Edit post" }));

    expect(screen.getByRole("textbox", { name: "Edit post content" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit post" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete post" })).not.toBeInTheDocument();
  });

  it("pre-fills the textarea with the current post content", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Edit post" }));

    expect(screen.getByRole("textbox", { name: "Edit post content" })).toHaveValue(
      "Just finished Dune!"
    );
  });

  it("discards changes and returns to view mode when X is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Edit post" }));

    const textarea = screen.getByRole("textbox", { name: "Edit post content" });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Something else");
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(screen.queryByRole("textbox", { name: "Edit post content" })).not.toBeInTheDocument();
    expect(screen.getByText("Just finished Dune!")).toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("disables the save button when the textarea is empty", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Edit post" }));

    const textarea = screen.getByRole("textbox", { name: "Edit post content" });
    await userEvent.clear(textarea);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("calls mutateAsync with updated content and exits edit mode on success", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={MOCK_POST} isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Edit post" }));
    const textarea = screen.getByRole("textbox", { name: "Edit post content" });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated content");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        postId: "post-1",
        content: "Updated content",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: "Edit post content" })).not.toBeInTheDocument();
    });
  });

  it("shows an error toast and stays in edit mode when saving fails", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<PostCard post={MOCK_POST} isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Edit post" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to save changes.");
    });
    expect(screen.getByRole("textbox", { name: "Edit post content" })).toBeInTheDocument();
  });
});

const SPOILER_POST = { ...MOCK_POST, hasSpoilers: true, content: "Dumbledore dies." };

describe("PostCard — spoilers", () => {
  it("hides the content and shows a warning when hasSpoilers is true", () => {
    render(<PostCard post={SPOILER_POST} />);

    expect(screen.getByText("This post contains spoilers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show anyway" })).toBeInTheDocument();
    expect(screen.queryByText("Dumbledore dies.")).not.toBeInTheDocument();
  });

  it("reveals the content when Show anyway is clicked", async () => {
    render(<PostCard post={SPOILER_POST} />);
    await userEvent.click(screen.getByRole("button", { name: "Show anyway" }));

    expect(screen.getByText("Dumbledore dies.")).toBeInTheDocument();
    expect(screen.queryByText("This post contains spoilers")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show anyway" })).not.toBeInTheDocument();
  });

  it("shows the Hide spoiler button after revealing", async () => {
    render(<PostCard post={SPOILER_POST} />);
    await userEvent.click(screen.getByRole("button", { name: "Show anyway" }));

    expect(screen.getByRole("button", { name: "Hide spoiler" })).toBeInTheDocument();
  });

  it("hides the content again when Hide spoiler is clicked", async () => {
    render(<PostCard post={SPOILER_POST} />);
    await userEvent.click(screen.getByRole("button", { name: "Show anyway" }));
    await userEvent.click(screen.getByRole("button", { name: "Hide spoiler" }));

    expect(screen.getByText("This post contains spoilers")).toBeInTheDocument();
    expect(screen.queryByText("Dumbledore dies.")).not.toBeInTheDocument();
  });

  it("does not show the Hide spoiler button on non-spoiler posts", () => {
    render(<PostCard post={MOCK_POST} />);

    expect(screen.queryByRole("button", { name: "Hide spoiler" })).not.toBeInTheDocument();
    expect(screen.getByText("Just finished Dune!")).toBeInTheDocument();
  });
});
