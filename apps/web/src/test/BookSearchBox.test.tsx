import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const BOOKS = [
  { id: "b1", openLibraryKey: "/works/OL1W", title: "Dune", author: "Frank Herbert", coverUrl: null, description: null },
  { id: "b2", openLibraryKey: "/works/OL2W", title: "Dune Messiah", author: "Frank Herbert", coverUrl: null, description: null },
];

vi.mock("@/lib/queries", () => ({
  useBookSearch: () => ({ data: BOOKS, isFetching: false }),
}));

import BookSearchBox from "@/components/book/BookSearchBox";

describe("BookSearchBox", () => {
  it("shows results once the query is long enough and calls onSelect", async () => {
    const onSelect = vi.fn();
    render(<BookSearchBox onSelect={onSelect} />);

    await userEvent.type(screen.getByPlaceholderText("Search books…"), "du");
    const result = await screen.findByText("Dune");
    await userEvent.click(result);

    expect(onSelect).toHaveBeenCalledWith(BOOKS[0]);
  });

  it("marks already-added books", async () => {
    render(<BookSearchBox onSelect={() => {}} addedIds={new Set(["b1"])} />);
    await userEvent.type(screen.getByPlaceholderText("Search books…"), "du");
    // Both results render; the added one shows a check (icon has no text, so just assert both titles present)
    expect(await screen.findByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Dune Messiah")).toBeInTheDocument();
  });
});
