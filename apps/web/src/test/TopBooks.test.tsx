import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseTopBooks = vi.hoisted(() => vi.fn());
const mockSetMutate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useTopBooks: () => mockUseTopBooks(),
  useSetTopBooks: () => ({ mutate: mockSetMutate }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
}));
// Stub the book search so selecting always adds a fixed book.
vi.mock("@/components/book/BookSearchBox", () => ({
  default: ({ onSelect }: { onSelect: (b: unknown) => void }) => (
    <button onClick={() => onSelect({ id: "b9", title: "New Book", author: "A", coverUrl: null })}>
      mock-add
    </button>
  ),
}));

import TopBooks from "@/components/profile/TopBooks";

const BOOKS = [
  { id: "b1", title: "Dune", author: "Frank Herbert", coverUrl: "http://x/dune.jpg" },
  { id: "b2", title: "Foundation", author: "Isaac Asimov", coverUrl: "http://x/found.jpg" },
];

describe("TopBooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTopBooks.mockReturnValue({ data: BOOKS, isLoading: false });
  });

  it("renders favorite covers for a visitor (no add slots)", () => {
    render(<TopBooks username="alice" isOwner={false} />);
    expect(screen.getByAltText("Dune")).toBeInTheDocument();
    expect(screen.getByAltText("Foundation")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add a book/i })).not.toBeInTheDocument();
  });

  it("renders nothing for a visitor with no favorites", () => {
    mockUseTopBooks.mockReturnValue({ data: [], isLoading: false });
    const { container } = render(<TopBooks username="alice" isOwner={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 8 empty add slots for an owner with no favorites", () => {
    mockUseTopBooks.mockReturnValue({ data: [], isLoading: false });
    render(<TopBooks username="alice" isOwner />);
    expect(screen.getAllByRole("button", { name: /add a book/i })).toHaveLength(8);
  });

  it("removes a book and saves the new order", async () => {
    render(<TopBooks username="alice" isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Dune" }));
    expect(mockSetMutate).toHaveBeenCalledWith(["b2"], expect.anything());
  });

  it("adds a book from the + slot modal and saves", async () => {
    mockUseTopBooks.mockReturnValue({ data: [BOOKS[0]], isLoading: false });
    render(<TopBooks username="alice" isOwner />);
    await userEvent.click(screen.getAllByRole("button", { name: /add a book/i })[0]);
    await userEvent.click(screen.getByRole("button", { name: "mock-add" }));
    expect(mockSetMutate).toHaveBeenCalledWith(["b1", "b9"], expect.anything());
  });
});
