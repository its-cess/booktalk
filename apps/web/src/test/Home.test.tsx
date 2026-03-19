import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseFeed = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/queries", () => ({ useFeed: mockUseFeed }));

// Stub child components so Home tests focus only on Home's own logic
vi.mock("@/components/post/PostComposer", () => ({
  default: () => <div data-testid="post-composer" />,
}));
vi.mock("@/components/post/PostCard", () => ({
  default: ({ post }: { post: { content: string } }) => (
    <div data-testid="post-card">{post.content}</div>
  ),
}));

import Home from "@/pages/Home";

const MOCK_POST = {
  id: "1",
  content: "Just finished Dune!",
  bookTitle: null,
  bookAuthor: null,
  hasSpoilers: false,
  createdAt: new Date().toISOString(),
  author: { id: "u1", username: "alice", displayName: "Alice" },
};

describe("Home — unauthenticated", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseFeed.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  });

  it("shows the sign up / log in CTA", () => {
    render(<Home />);
    expect(screen.getByText("Sign up or log in to start posting and following.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });
});

describe("Home — authenticated", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
  });

  it("shows the loading state while the feed is fetching", () => {
    mockUseFeed.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Home />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows the error state when the feed fails to load", () => {
    mockUseFeed.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Home />);
    expect(screen.getByText("Failed to load feed.")).toBeInTheDocument();
  });

  it("shows the empty state when there are no posts", () => {
    mockUseFeed.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Home />);
    expect(screen.getByText("No posts yet. Be the first to post!")).toBeInTheDocument();
  });

  it("renders a PostCard for each post in the feed", () => {
    mockUseFeed.mockReturnValue({
      data: [MOCK_POST, { ...MOCK_POST, id: "2", content: "Reading Stormlight now" }],
      isLoading: false,
      isError: false,
    });
    render(<Home />);
    const cards = screen.getAllByTestId("post-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Just finished Dune!")).toBeInTheDocument();
    expect(screen.getByText("Reading Stormlight now")).toBeInTheDocument();
  });

  it("renders the composer", () => {
    mockUseFeed.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Home />);
    expect(screen.getByTestId("post-composer")).toBeInTheDocument();
  });
});
