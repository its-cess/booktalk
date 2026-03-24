import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

import { api } from "@/lib/api";
import { useCreatePost, useDeletePost, FEED_KEY, TRENDING_KEY } from "@/lib/queries";

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useCreatePost", () => {
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  });

  it("invalidates FEED_KEY on success", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { post: { id: "p1", content: "Hello" } },
    });

    const { result } = renderHook(() => useCreatePost(), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ content: "Hello", hasSpoilers: false });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: FEED_KEY });
  });

  it("invalidates TRENDING_KEY on success", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { post: { id: "p1", content: "Hello" } },
    });

    const { result } = renderHook(() => useCreatePost(), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ content: "Hello", hasSpoilers: false });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRENDING_KEY });
  });
});

describe("useDeletePost", () => {
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  });

  it("invalidates FEED_KEY on success", async () => {
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { result } = renderHook(() => useDeletePost(), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync("post-1");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: FEED_KEY });
  });

  it("invalidates TRENDING_KEY on success", async () => {
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { result } = renderHook(() => useDeletePost(), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync("post-1");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRENDING_KEY });
  });
});
