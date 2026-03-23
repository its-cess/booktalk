import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockDeleteMutateAsync = vi.hoisted(() => vi.fn());
const mockUpdateMutateAsync = vi.hoisted(() => vi.fn());
const mockToggleLikeMutateAsync = vi.hoisted(() => vi.fn());
const mockToggleCommentsMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseBookSearch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useDeletePost: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
  useUpdatePost: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
  useTogglePostLike: () => ({ mutateAsync: mockToggleLikeMutateAsync, isPending: false }),
  useToggleCommentsDisabled: () => ({ mutateAsync: mockToggleCommentsMutateAsync, isPending: false }),
  useBookSearch: mockUseBookSearch,
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

import PostCard from "@/components/post/PostCard";

const MOCK_POST = {
  id: "post-1",
  authorDisplayName: "Alice",
  authorUsername: "alice",
  content: "Just finished Dune!",
  hasSpoilers: false,
  commentsDisabled: false,
  createdAt: new Date().toISOString(),
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
};

async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: "Post options" }));
}

describe("PostCard — delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not show the options menu when isOwner is false", () => {
    render(<PostCard post={MOCK_POST} />);
    expect(screen.queryByRole("button", { name: "Post options" })).not.toBeInTheDocument();
  });

  it("shows the options menu button when isOwner is true", () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    expect(screen.getByRole("button", { name: "Post options" })).toBeInTheDocument();
  });

  it("opens the confirmation dialog when Delete post is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete post/i }));

    expect(screen.getByRole("heading", { name: "Delete post" })).toBeInTheDocument();
    expect(screen.getByText(/can't be undone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete post/i }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it("closes the dialog when the overlay is clicked", async () => {
    const { container } = render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete post/i }));

    const overlay = document.body.querySelector<HTMLElement>("[style*='rgba(0, 0, 0']");
    expect(overlay).not.toBeNull();
    await userEvent.click(overlay!);

    expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    void container;
  });

  it("calls mutateAsync with the post id and closes the dialog on success", async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={MOCK_POST} isOwner />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete post/i }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockDeleteMutateAsync).toHaveBeenCalledWith("post-1"));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Delete post" })).not.toBeInTheDocument();
    });
  });

  it("shows an error toast when deletion fails", async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<PostCard post={MOCK_POST} isOwner />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete post/i }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete post.");
    });
  });
});

describe("PostCard — edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookSearch.mockReturnValue({ data: [], isFetching: false });
  });

  it("does not show the options menu when isOwner is false", () => {
    render(<PostCard post={MOCK_POST} />);
    expect(screen.queryByRole("button", { name: "Post options" })).not.toBeInTheDocument();
  });

  it("shows the options menu button when isOwner is true", () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    expect(screen.getByRole("button", { name: "Post options" })).toBeInTheDocument();
  });

  it("switches to edit mode when Edit post is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));

    expect(screen.getByRole("textbox", { name: "Edit post content" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Post options" })).not.toBeInTheDocument();
  });

  it("pre-fills the textarea with the current post content", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));

    expect(screen.getByRole("textbox", { name: "Edit post content" })).toHaveValue(
      "Just finished Dune!"
    );
  });

  it("discards changes and returns to view mode when X is clicked", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));

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
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));

    const textarea = screen.getByRole("textbox", { name: "Edit post content" });
    await userEvent.clear(textarea);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("calls mutateAsync with updated content and exits edit mode on success", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={MOCK_POST} isOwner />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    const textarea = screen.getByRole("textbox", { name: "Edit post content" });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated content");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        postId: "post-1",
        content: "Updated content",
        authorUsername: "alice",
        hasSpoilers: false,
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: "Edit post content" })).not.toBeInTheDocument();
    });
  });

  it("shows an error toast and stays in edit mode when saving fails", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<PostCard post={MOCK_POST} isOwner />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
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

describe("PostCard — like button", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the like count", () => {
    render(<PostCard post={{ ...MOCK_POST, likeCount: 7 }} />);
    expect(screen.getByRole("button", { name: "Like post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like post" })).toHaveTextContent("7");
  });

  it("shows 'Unlike post' aria-label when already liked", () => {
    render(<PostCard post={{ ...MOCK_POST, isLiked: true }} />);
    expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();
  });

  it("shows 'Like post' aria-label when not liked", () => {
    render(<PostCard post={{ ...MOCK_POST, isLiked: false }} />);
    expect(screen.getByRole("button", { name: "Like post" })).toBeInTheDocument();
  });

  it("calls toggleLike with the post id when clicked", async () => {
    mockToggleLikeMutateAsync.mockResolvedValueOnce({ isLiked: true });
    render(<PostCard post={MOCK_POST} />);
    await userEvent.click(screen.getByRole("button", { name: "Like post" }));
    expect(mockToggleLikeMutateAsync).toHaveBeenCalledWith({ postId: "post-1", authorUsername: "alice" });
  });

  it("shows an error toast when liking fails", async () => {
    mockToggleLikeMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<PostCard post={MOCK_POST} />);
    await userEvent.click(screen.getByRole("button", { name: "Like post" }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to like post.");
    });
  });
});

describe("PostCard — comment button", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the comment count", () => {
    render(<PostCard post={{ ...MOCK_POST, commentCount: 3 }} />);
    expect(screen.getByRole("button", { name: "View comments" })).toHaveTextContent("3");
  });

  it("navigates to /posts/:id when the comment button is clicked", async () => {
    render(<PostCard post={MOCK_POST} />);
    await userEvent.click(screen.getByRole("button", { name: "View comments" }));
    expect(mockNavigate).toHaveBeenCalledWith("/posts/post-1");
  });

  it("does not navigate when isDetailView is true", async () => {
    render(<PostCard post={MOCK_POST} isDetailView />);
    await userEvent.click(screen.getByRole("button", { name: "View comments" }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("hides the comment button when commentsDisabled is true", () => {
    render(<PostCard post={{ ...MOCK_POST, commentsDisabled: true }} />);
    expect(screen.queryByRole("button", { name: "View comments" })).not.toBeInTheDocument();
  });

  it("shows the comment button when commentsDisabled is false", () => {
    render(<PostCard post={{ ...MOCK_POST, commentsDisabled: false }} />);
    expect(screen.getByRole("button", { name: "View comments" })).toBeInTheDocument();
  });
});

describe("PostCard — card navigation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("navigates to /posts/:id when the card body is clicked", async () => {
    const { container } = render(<PostCard post={MOCK_POST} />);
    await userEvent.click(container.firstChild as HTMLElement);
    expect(mockNavigate).toHaveBeenCalledWith("/posts/post-1");
  });

  it("does not navigate when isDetailView is true", async () => {
    const { container } = render(<PostCard post={MOCK_POST} isDetailView />);
    await userEvent.click(container.firstChild as HTMLElement);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to the author profile when the author link is clicked, not to the post", async () => {
    render(<PostCard post={MOCK_POST} />);
    await userEvent.click(screen.getByText("Alice"));
    // navigate should NOT be called for the post — the author link handles its own routing
    expect(mockNavigate).not.toHaveBeenCalledWith("/posts/post-1");
  });
});

const BOOK_POST = {
  ...MOCK_POST,
  book: { id: "book-1", title: "Dune", author: "Frank Herbert", coverUrl: "https://example.com/cover.jpg" },
};

const MANUAL_BOOK_POST = {
  ...MOCK_POST,
  book: null,
  bookTitle: "Foundation",
  bookAuthor: "Isaac Asimov",
};

describe("PostCard — book display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookSearch.mockReturnValue({ data: [], isFetching: false });
  });

  it("shows a book cover image when post.book.coverUrl is present", () => {
    render(<PostCard post={BOOK_POST} />);
    expect(screen.getByRole("img", { name: "Dune" })).toBeInTheDocument();
  });

  it("does not show the Remove book button in view mode", () => {
    render(<PostCard post={BOOK_POST} isOwner />);
    expect(screen.queryByRole("button", { name: "Remove book" })).not.toBeInTheDocument();
  });

  it("shows the Remove book button over the cover image in edit mode", async () => {
    render(<PostCard post={BOOK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    expect(screen.getByRole("button", { name: "Remove book" })).toBeInTheDocument();
  });

  it("hides the cover and shows the book picker after clicking Remove book in edit mode", async () => {
    render(<PostCard post={BOOK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    await userEvent.click(screen.getByRole("button", { name: "Remove book" }));

    expect(screen.queryByRole("img", { name: "Dune" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove book" })).not.toBeInTheDocument();
  });

  it("saves with clearBook: true when book was removed in edit mode", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={BOOK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    await userEvent.click(screen.getByRole("button", { name: "Remove book" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ postId: "post-1", clearBook: true })
      );
    });
  });

  it("restores the book cover when discarding after clicking Remove book", async () => {
    render(<PostCard post={BOOK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    await userEvent.click(screen.getByRole("button", { name: "Remove book" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(screen.getByRole("img", { name: "Dune" })).toBeInTheDocument();
  });

  it("shows a book pill for a manually entered book (no cover)", () => {
    render(<PostCard post={MANUAL_BOOK_POST} />);
    expect(screen.getByText(/Foundation/)).toBeInTheDocument();
    expect(screen.getByText(/Isaac Asimov/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows Remove book button on the pill in edit mode for a manual book", async () => {
    render(<PostCard post={MANUAL_BOOK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    expect(screen.getByRole("button", { name: "Remove book" })).toBeInTheDocument();
  });

  it("shows the + Book button in edit mode when the post has no book", async () => {
    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    expect(screen.getByRole("button", { name: "+ Book" })).toBeInTheDocument();
  });

  it("saves with bookId when a book is selected from search in edit mode", async () => {
    const searchBook = {
      id: "book-99",
      openLibraryKey: "/works/OL99",
      title: "Foundation",
      author: "Isaac Asimov",
      coverUrl: null,
    };
    mockUseBookSearch.mockReturnValue({ data: [searchBook], isFetching: false });
    mockUpdateMutateAsync.mockResolvedValueOnce({});

    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    await userEvent.click(screen.getByRole("button", { name: "+ Book" }));
    await userEvent.click(screen.getByRole("button", { name: /Foundation/i }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ postId: "post-1", bookId: "book-99" })
      );
    });
  });

  it("saves with bookTitle/bookAuthor when entered manually in edit mode", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});

    render(<PostCard post={MOCK_POST} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit post/i }));
    await userEvent.click(screen.getByRole("button", { name: "+ Book" }));
    await userEvent.click(screen.getByRole("button", { name: /add manually instead/i }));
    await userEvent.type(screen.getByPlaceholderText("Book title"), "Neuromancer");
    await userEvent.type(screen.getByPlaceholderText("Author"), "William Gibson");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-1",
          bookTitle: "Neuromancer",
          bookAuthor: "William Gibson",
        })
      );
    });
  });
});

describe("PostCard — disable comments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows 'Disable comments' in the owner menu when comments are enabled", async () => {
    render(<PostCard post={{ ...MOCK_POST, commentsDisabled: false }} isOwner />);
    await openMenu();
    expect(screen.getByRole("menuitem", { name: /disable comments/i })).toBeInTheDocument();
  });

  it("shows 'Enable comments' in the owner menu when comments are disabled", async () => {
    render(<PostCard post={{ ...MOCK_POST, commentsDisabled: true }} isOwner />);
    await openMenu();
    expect(screen.getByRole("menuitem", { name: /enable comments/i })).toBeInTheDocument();
  });

  it("calls toggleComments with commentsDisabled=true when disabling", async () => {
    mockToggleCommentsMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={{ ...MOCK_POST, commentsDisabled: false }} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /disable comments/i }));
    expect(mockToggleCommentsMutateAsync).toHaveBeenCalledWith({
      postId: "post-1",
      commentsDisabled: true,
    });
  });

  it("calls toggleComments with commentsDisabled=false when enabling", async () => {
    mockToggleCommentsMutateAsync.mockResolvedValueOnce({});
    render(<PostCard post={{ ...MOCK_POST, commentsDisabled: true }} isOwner />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /enable comments/i }));
    expect(mockToggleCommentsMutateAsync).toHaveBeenCalledWith({
      postId: "post-1",
      commentsDisabled: false,
    });
  });

  it("does not show the owner menu to non-owners", () => {
    render(<PostCard post={MOCK_POST} />);
    expect(screen.queryByRole("button", { name: "Post options" })).not.toBeInTheDocument();
  });
});
