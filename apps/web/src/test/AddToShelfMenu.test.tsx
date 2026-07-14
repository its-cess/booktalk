import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockAdd = vi.hoisted(() => vi.fn());
const mockAddAsync = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());
const mockCreateAsync = vi.hoisted(() => vi.fn());
const mockUseMyShelves = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useMyShelves: () => mockUseMyShelves(),
  useAddToShelf: () => ({ mutate: mockAdd, mutateAsync: mockAddAsync }),
  useRemoveFromShelf: () => ({ mutate: mockRemove }),
  useCreateShelf: () => ({ mutateAsync: mockCreateAsync, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import AddToShelfMenu from "@/components/shelf/AddToShelfMenu";

const SHELVES = [
  { id: "s1", name: "Want to Read", isSystem: true, containsBook: false },
  { id: "s2", name: "Faves", isSystem: false, containsBook: true },
];

function renderMenu() {
  render(
    <AddToShelfMenu bookId="b1">
      <button>Open</button>
    </AddToShelfMenu>
  );
}

async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
}

describe("AddToShelfMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyShelves.mockReturnValue({ data: SHELVES });
  });

  it("lists the user's shelves", async () => {
    renderMenu();
    await openMenu();
    expect(screen.getByText("Want to Read")).toBeInTheDocument();
    expect(screen.getByText("Faves")).toBeInTheDocument();
  });

  it("adds the book to a shelf it isn't on", async () => {
    renderMenu();
    await openMenu();
    await userEvent.click(screen.getByText("Want to Read"));
    expect(mockAdd).toHaveBeenCalledWith({ shelfId: "s1", bookId: "b1" }, expect.anything());
  });

  it("removes the book from a shelf it's already on", async () => {
    renderMenu();
    await openMenu();
    await userEvent.click(screen.getByText("Faves"));
    expect(mockRemove).toHaveBeenCalledWith({ shelfId: "s2", bookId: "b1" }, expect.anything());
  });

  it("creates a new shelf and adds the book to it", async () => {
    mockCreateAsync.mockResolvedValueOnce({ id: "s3", name: "Sci-Fi" });
    renderMenu();
    await openMenu();
    await userEvent.click(screen.getByText(/new shelf/i));
    await userEvent.type(screen.getByPlaceholderText("Shelf name"), "Sci-Fi");
    await userEvent.click(screen.getByRole("button", { name: /create shelf/i }));
    expect(mockCreateAsync).toHaveBeenCalledWith({ name: "Sci-Fi" });
    await vi.waitFor(() =>
      expect(mockAddAsync).toHaveBeenCalledWith({ shelfId: "s3", bookId: "b1" })
    );
  });
});
