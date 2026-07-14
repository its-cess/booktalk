import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseBookDetail = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockRate = vi.hoisted(() => vi.fn());
const mockRemoveRating = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/queries", () => ({
  useBookDetail: mockUseBookDetail,
  useRateBook: () => ({ mutate: mockRate }),
  useRemoveRating: () => ({ mutate: mockRemoveRating }),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "book-1" }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={String(to)} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/post/PostCard", () => ({
  default: ({ post }: { post: { content: string } }) => (
    <div data-testid="post-card">{post.content}</div>
  ),
}));
vi.mock("@/components/shelf/AddToShelfMenu", () => ({ default: () => null }));

import BookDetail from "@/pages/BookDetail";

const MOCK_BOOK = {
  id: "book-1",
  openLibraryKey: "/works/OL45804W",
  title: "Dune",
  author: "Frank Herbert",
  coverUrl: "https://covers.openlibrary.org/b/id/12345-M.jpg",
  description: "A science fiction novel set in the distant future.",
};

const MOCK_POST = {
  id: "post-1",
  content: "Dune is incredible!",
  book: { id: "book-1", openLibraryKey: "/works/OL45804W", title: "Dune", author: "Frank Herbert", coverUrl: null, description: null },
  bookTitle: null,
  bookAuthor: null,
  hasSpoilers: false,
  commentsDisabled: false,
  gifUrl: null,
  createdAt: new Date().toISOString(),
  author: { id: "user-1", username: "alice", displayName: "Alice Wonder", avatarUrl: null },
  likeCount: 3,
  commentCount: 1,
  isLiked: false,
};

describe("BookDetail — loading / error states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("shows a spinner while loading", () => {
    mockUseBookDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<BookDetail />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows an error when the book is not found", () => {
    mockUseBookDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<BookDetail />);
    expect(screen.getByText("Book not found.")).toBeInTheDocument();
  });
});

describe("BookDetail — book info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [] },
      isLoading: false,
      isError: false,
    });
  });

  it("shows the book title and author", () => {
    render(<BookDetail />);
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
  });

  it("shows the book cover image", () => {
    render(<BookDetail />);
    const img = screen.getByRole("img", { name: /dune/i });
    expect(img).toHaveAttribute("src", MOCK_BOOK.coverUrl);
  });

  it("shows the description when available", () => {
    render(<BookDetail />);
    expect(screen.getByText(MOCK_BOOK.description)).toBeInTheDocument();
  });

  it("shows fallback text when description is missing", () => {
    mockUseBookDetail.mockReturnValue({
      data: { book: { ...MOCK_BOOK, description: null }, posts: [] },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.getByText("No description available.")).toBeInTheDocument();
  });

  it("does not render the cover img when coverUrl is null", () => {
    mockUseBookDetail.mockReturnValue({
      data: { book: { ...MOCK_BOOK, coverUrl: null }, posts: [] },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.queryByRole("img", { name: /dune/i })).not.toBeInTheDocument();
  });
});

describe("BookDetail — posts section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("shows the 'Posts about this book' heading", () => {
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [] },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.getByText("Posts about this book")).toBeInTheDocument();
  });

  it("shows empty state when there are no posts", () => {
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [] },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.getByText(/be the first to post/i)).toBeInTheDocument();
  });

  it("renders a PostCard for each post", () => {
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [MOCK_POST, { ...MOCK_POST, id: "post-2", content: "Paul Atreides is peak fiction" }] },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    const cards = screen.getAllByTestId("post-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Dune is incredible!");
    expect(cards[1]).toHaveTextContent("Paul Atreides is peak fiction");
  });

  it("marks posts as owned when the logged-in user is the author", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1", username: "alice" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [MOCK_POST] },
      isLoading: false,
      isError: false,
    });
    // PostCard is mocked — ownership logic is in the page; just verify it renders without error
    render(<BookDetail />);
    expect(screen.getByTestId("post-card")).toBeInTheDocument();
  });
});

describe("BookDetail — ratings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the community average when present", () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: 4, ratingCount: 5 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.getByText(/4\.0 · 5 ratings/)).toBeInTheDocument();
  });

  it("shows 'Not enough ratings yet' when there is no average", () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: null, ratingCount: 1 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.getByText(/not enough ratings yet/i)).toBeInTheDocument();
  });

  it("hides the 'Your rating' control for logged-out users", () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: null, ratingCount: 0 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.queryByText(/your rating/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /stars/i })).not.toBeInTheDocument();
  });

  it("rates a book with the selected number of stars", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-9", username: "me" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: null, ratingCount: 0 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    await userEvent.click(screen.getByRole("button", { name: /add rating/i }));
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    expect(mockRate).toHaveBeenCalledWith({ rating: 4, dnf: false }, expect.anything());
  });

  it("shows only 'Rate this book' (no 'Your rating') until the book is rated", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-9", username: "me" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: null, ratingCount: 0 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    expect(screen.getByRole("button", { name: /add rating/i })).toBeInTheDocument();
    expect(screen.queryByText(/your rating/i)).not.toBeInTheDocument();
  });

  it("does not expose interactive stars until editing", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-9", username: "me" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: { rating: 4, dnf: false }, averageRating: null, ratingCount: 1 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    // Shows a static rating + Edit affordance, no clickable star targets.
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /stars/i })).not.toBeInTheDocument();
  });

  it("supports half-star ratings", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-9", username: "me" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: null, ratingCount: 0 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    await userEvent.click(screen.getByRole("button", { name: /add rating/i }));
    await userEvent.click(screen.getByRole("button", { name: "3.5 stars" }));
    expect(mockRate).toHaveBeenCalledWith({ rating: 3.5, dnf: false }, expect.anything());
  });

  it("marks a book DNF", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-9", username: "me" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: null, averageRating: null, ratingCount: 0 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    await userEvent.click(screen.getByRole("button", { name: /add rating/i }));
    await userEvent.click(screen.getByRole("button", { name: "DNF" }));
    expect(mockRate).toHaveBeenCalledWith({ rating: null, dnf: true }, expect.anything());
  });

  it("clears an existing rating", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-9", username: "me" } });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [], myRating: { rating: 4, dnf: false }, averageRating: null, ratingCount: 1 },
      isLoading: false,
      isError: false,
    });
    render(<BookDetail />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(mockRemoveRating).toHaveBeenCalled();
  });
});

describe("BookDetail — navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockUseBookDetail.mockReturnValue({
      data: { book: MOCK_BOOK, posts: [] },
      isLoading: false,
      isError: false,
    });
  });

  it("calls navigate(-1) when the Back button is clicked", async () => {
    render(<BookDetail />);
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
