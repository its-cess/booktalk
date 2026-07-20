import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockUseBookSearch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useCreatePost: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useBookSearch: mockUseBookSearch,
  useUserSearch: () => ({ data: [] }),
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

import PostComposer from "@/components/post/PostComposer";

const MOCK_BOOK = {
  id: "book-1",
  openLibraryKey: "/works/OL1",
  title: "Dune",
  author: "Frank Herbert",
  coverUrl: null,
};

describe("PostComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookSearch.mockReturnValue({ data: [], isFetching: false });
  });

  it("has the Post button disabled when the textarea is empty", () => {
    render(<PostComposer />);
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
  });

  it("enables the Post button once content is typed", async () => {
    render(<PostComposer />);
    await userEvent.type(screen.getByPlaceholderText("What are you reading?"), "Hello");
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });

  it("clicking + Book opens the search panel", async () => {
    render(<PostComposer />);
    expect(screen.queryByPlaceholderText("Search for a book...")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add book" }));

    expect(screen.getByPlaceholderText("Search for a book...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove book" })).toBeInTheDocument();
  });

  it("Remove book clears the search panel", async () => {
    render(<PostComposer />);
    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove book" }));

    expect(screen.queryByPlaceholderText("Search for a book...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add book" })).toBeInTheDocument();
  });

  it("switching to manual shows title and author fields with a back link", async () => {
    render(<PostComposer />);
    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    await userEvent.click(screen.getByRole("button", { name: /add manually instead/i }));

    expect(screen.getByPlaceholderText("Book title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Author")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search for a book...")).not.toBeInTheDocument();
  });

  it("can switch back to search from manual mode", async () => {
    render(<PostComposer />);
    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    await userEvent.click(screen.getByRole("button", { name: /add manually instead/i }));
    await userEvent.click(screen.getByRole("button", { name: /search instead/i }));

    expect(screen.queryByPlaceholderText("Book title")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search for a book...")).toBeInTheDocument();
  });

  it("selecting a book from results shows the selected book chip", async () => {
    mockUseBookSearch.mockReturnValue({ data: [MOCK_BOOK], isFetching: false });
    render(<PostComposer />);

    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    // Click the result button (its accessible name contains the book title and author)
    await userEvent.click(screen.getByRole("button", { name: /Dune/i }));

    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search for a book...")).not.toBeInTheDocument();
    // Both the chip's X button and the toolbar "Remove book" button are present
    expect(screen.getAllByRole("button", { name: "Remove book" })).toHaveLength(2);
  });

  it("Remove book clears a selected book chip", async () => {
    mockUseBookSearch.mockReturnValue({ data: [MOCK_BOOK], isFetching: false });
    render(<PostComposer />);

    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    await userEvent.click(screen.getByRole("button", { name: /Dune/i }));
    // Click the toolbar "Remove book" button (the chip's X also works, either clears the selection)
    const removeButtons = screen.getAllByRole("button", { name: "Remove book" });
    await userEvent.click(removeButtons[0]);

    expect(screen.queryByText("Frank Herbert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add book" })).toBeInTheDocument();
  });

  it("toggles the spoiler checkbox", async () => {
    render(<PostComposer />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("submits with manual book title and author", async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    render(<PostComposer />);

    await userEvent.type(screen.getByPlaceholderText("What are you reading?"), "Great book!");
    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    await userEvent.click(screen.getByRole("button", { name: /add manually instead/i }));
    await userEvent.type(screen.getByPlaceholderText("Book title"), "Dune");
    await userEvent.type(screen.getByPlaceholderText("Author"), "Frank Herbert");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        content: "Great book!",
        bookTitle: "Dune",
        bookAuthor: "Frank Herbert",
        hasSpoilers: true,
      });
    });

    // Form resets after successful post
    await waitFor(() => {
      expect(screen.getByPlaceholderText("What are you reading?")).toHaveValue("");
    });
  });

  it("submits with bookId when a book is selected from search", async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    mockUseBookSearch.mockReturnValue({ data: [MOCK_BOOK], isFetching: false });
    render(<PostComposer />);

    await userEvent.type(screen.getByPlaceholderText("What are you reading?"), "Great book!");
    await userEvent.click(screen.getByRole("button", { name: "Add book" }));
    await userEvent.click(screen.getByRole("button", { name: /Dune/i }));
    await userEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        content: "Great book!",
        bookId: "book-1",
        hasSpoilers: false,
      });
    });
  });

  it("shows an error toast and keeps the form intact when posting fails", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));
    render(<PostComposer />);

    await userEvent.type(screen.getByPlaceholderText("What are you reading?"), "Great book!");
    await userEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to post. Please try again.");
    });

    // Content should still be there so the user doesn't lose their post
    expect(screen.getByPlaceholderText("What are you reading?")).toHaveValue("Great book!");
  });
});
