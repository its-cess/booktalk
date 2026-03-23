import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseFeed = vi.hoisted(() => vi.fn());
const mockUseTrendingFeed = vi.hoisted(() => vi.fn());
const mockUseToggleFollow = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/queries", () => ({
  useFeed: mockUseFeed,
  useTrendingFeed: mockUseTrendingFeed,
  useToggleFollow: mockUseToggleFollow,
  FEED_KEY: ["posts", "feed"],
  TRENDING_KEY: ["posts", "trending"],
}));

vi.mock("@/components/post/PostComposer", () => ({
  default: () => <div data-testid="post-composer" />,
}));
vi.mock("@/components/post/PostCard", () => ({
  default: ({ post }: { post: { content: string } }) => (
    <div data-testid="post-card">{post.content}</div>
  ),
}));

import Home from "@/pages/Home";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const MOCK_POST = {
  id: "1",
  content: "Just finished Dune!",
  bookTitle: null,
  bookAuthor: null,
  hasSpoilers: false,
  createdAt: new Date().toISOString(),
  author: { id: "u1", username: "alice", displayName: "Alice", avatarUrl: null },
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
  isFollowingAuthor: false,
};

describe("Home — unauthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    mockUseFeed.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockUseTrendingFeed.mockReturnValue({ data: undefined, isLoading: false });
    mockUseToggleFollow.mockReturnValue({ mutateAsync: vi.fn() });
  });

  it("shows the sign up / log in CTA", () => {
    renderWithClient(<Home />);
    expect(screen.getByText("Sign up or log in to start posting and following.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });
});

describe("Home — authenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: "u1", username: "alice" } });
    mockUseTrendingFeed.mockReturnValue({ data: undefined, isLoading: false });
    mockUseToggleFollow.mockReturnValue({ mutateAsync: vi.fn() });
  });

  it("shows the loading state while the feed is fetching", () => {
    mockUseFeed.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mockUseTrendingFeed.mockReturnValue({ data: undefined, isLoading: true });
    renderWithClient(<Home />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows the error state when the feed fails to load", () => {
    mockUseFeed.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithClient(<Home />);
    expect(screen.getByText("Failed to load feed.")).toBeInTheDocument();
  });

  it("shows 'Your feed' heading when there are posts", () => {
    mockUseFeed.mockReturnValue({ data: [MOCK_POST], isLoading: false, isError: false });
    renderWithClient(<Home />);
    expect(screen.getByText("Your feed")).toBeInTheDocument();
  });

  it("renders a PostCard for each post in the feed", () => {
    mockUseFeed.mockReturnValue({
      data: [MOCK_POST, { ...MOCK_POST, id: "2", content: "Reading Stormlight now" }],
      isLoading: false,
      isError: false,
    });
    renderWithClient(<Home />);
    const cards = screen.getAllByTestId("post-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Just finished Dune!")).toBeInTheDocument();
    expect(screen.getByText("Reading Stormlight now")).toBeInTheDocument();
  });

  it("shows 'Trending' heading and hint when following feed is empty", () => {
    mockUseFeed.mockReturnValue({ data: [], isLoading: false, isError: false });
    mockUseTrendingFeed.mockReturnValue({ data: [MOCK_POST], isLoading: false });
    renderWithClient(<Home />);
    expect(screen.getByText("Trending")).toBeInTheDocument();
    expect(screen.getByText(/follow people to see their posts/i)).toBeInTheDocument();
  });

  it("renders trending posts when following feed is empty", () => {
    mockUseFeed.mockReturnValue({ data: [], isLoading: false, isError: false });
    mockUseTrendingFeed.mockReturnValue({
      data: [MOCK_POST, { ...MOCK_POST, id: "2", content: "Trending post" }],
      isLoading: false,
    });
    renderWithClient(<Home />);
    expect(screen.getAllByTestId("post-card")).toHaveLength(2);
  });

  it("appends non-duplicate trending posts after following feed posts", () => {
    const followedPost = { ...MOCK_POST, id: "1", content: "From someone I follow" };
    const trendingOnly = { ...MOCK_POST, id: "2", content: "Trending only post" };
    mockUseFeed.mockReturnValue({ data: [followedPost], isLoading: false, isError: false });
    mockUseTrendingFeed.mockReturnValue({ data: [followedPost, trendingOnly], isLoading: false });
    renderWithClient(<Home />);
    const cards = screen.getAllByTestId("post-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("From someone I follow")).toBeInTheDocument();
    expect(screen.getByText("Trending only post")).toBeInTheDocument();
  });

  it("renders the composer", () => {
    mockUseFeed.mockReturnValue({ data: [MOCK_POST], isLoading: false, isError: false });
    renderWithClient(<Home />);
    expect(screen.getByTestId("post-composer")).toBeInTheDocument();
  });
});
