import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseUserShelves = vi.hoisted(() => vi.fn());
const mockCreateAsync = vi.hoisted(() => vi.fn());
const mockRenameAsync = vi.hoisted(() => vi.fn());
const mockDeleteMutate = vi.hoisted(() => vi.fn());
const mockSetPrivacy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useUserShelves: () => mockUseUserShelves(),
  useCreateShelf: () => ({ mutateAsync: mockCreateAsync, isPending: false }),
  useRenameShelf: () => ({ mutateAsync: mockRenameAsync, isPending: false }),
  useDeleteShelf: () => ({ mutate: mockDeleteMutate, isPending: false }),
  useSetShelfPrivacy: () => ({ mutate: mockSetPrivacy, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
}));

import ShelvesSection from "@/components/shelf/ShelvesSection";

const SHELVES = [
  { id: "s1", name: "Want to Read", isSystem: true, isPrivate: false, itemCount: 2, coverUrls: [null], createdAt: new Date().toISOString() },
  { id: "s2", name: "Faves", isSystem: false, isPrivate: false, itemCount: 1, coverUrls: ["http://x/c.jpg"], createdAt: new Date().toISOString() },
];

describe("ShelvesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserShelves.mockReturnValue({ data: SHELVES, isLoading: false });
  });

  it("shows shelves and a New shelf control for the owner", () => {
    render(<ShelvesSection username="alice" isOwner />);
    expect(screen.getByRole("button", { name: /new shelf/i })).toBeInTheDocument();
    expect(screen.getByText("Want to Read")).toBeInTheDocument();
    expect(screen.getByText("Faves")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Options for Faves" })).toBeInTheDocument();
  });

  it("offers rename + delete for custom shelves, only privacy for the system shelf", async () => {
    render(<ShelvesSection username="alice" isOwner />);

    await userEvent.click(screen.getByRole("button", { name: "Options for Faves" }));
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Make private" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(screen.getByRole("button", { name: "Options for Want to Read" }));
    expect(screen.queryByRole("menuitem", { name: "Rename" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Make private" })).toBeInTheDocument();
  });

  it("hides management controls for non-owners", () => {
    render(<ShelvesSection username="alice" isOwner={false} />);
    expect(screen.getByText("Faves")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new shelf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /options for/i })).not.toBeInTheDocument();
  });

  it("shows an empty state for a non-owner with no shelves", () => {
    mockUseUserShelves.mockReturnValue({ data: [], isLoading: false });
    render(<ShelvesSection username="alice" isOwner={false} />);
    expect(screen.getByText(/no public shelves/i)).toBeInTheDocument();
  });

  it("toggles a shelf's privacy from the menu", async () => {
    render(<ShelvesSection username="alice" isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Options for Faves" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Make private" }));
    expect(mockSetPrivacy).toHaveBeenCalledWith({ shelfId: "s2", isPrivate: true }, expect.anything());
  });

  it("creates a new shelf", async () => {
    mockCreateAsync.mockResolvedValueOnce({ id: "s3", name: "Sci-Fi" });
    render(<ShelvesSection username="alice" isOwner />);
    await userEvent.click(screen.getByRole("button", { name: /new shelf/i }));
    await userEvent.type(screen.getByPlaceholderText("Shelf name"), "Sci-Fi");
    await userEvent.click(screen.getByRole("button", { name: /create shelf/i }));
    expect(mockCreateAsync).toHaveBeenCalledWith({ name: "Sci-Fi" });
  });

  it("deletes a custom shelf after confirmation", async () => {
    render(<ShelvesSection username="alice" isOwner />);
    await userEvent.click(screen.getByRole("button", { name: "Options for Faves" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("heading", { name: /delete "faves"/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(mockDeleteMutate).toHaveBeenCalledWith("s2", expect.anything());
  });
});
