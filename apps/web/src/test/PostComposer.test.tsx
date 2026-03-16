import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useCreatePost: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

import PostComposer from "@/components/post/PostComposer";

describe("PostComposer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("has the Post button disabled when the textarea is empty", () => {
    render(<PostComposer />);
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
  });

  it("enables the Post button once content is typed", async () => {
    render(<PostComposer />);
    await userEvent.type(screen.getByPlaceholderText("What are you reading?"), "Hello");
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });

  it("shows book title and author fields after clicking + Book, and hides them again", async () => {
    render(<PostComposer />);
    expect(screen.queryByPlaceholderText("Book title")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ Book" }));
    expect(screen.getByPlaceholderText("Book title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Author")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ Book" }));
    expect(screen.queryByPlaceholderText("Book title")).not.toBeInTheDocument();
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

  it("calls mutateAsync with the correct data and resets the form on success", async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    render(<PostComposer />);

    await userEvent.type(screen.getByPlaceholderText("What are you reading?"), "Great book!");
    await userEvent.click(screen.getByRole("button", { name: "+ Book" }));
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
