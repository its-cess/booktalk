import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockSupported = vi.hoisted(() => vi.fn());
const mockGetSub = vi.hoisted(() => vi.fn());
const mockEnable = vi.hoisted(() => vi.fn());
const mockDisable = vi.hoisted(() => vi.fn());

vi.mock("@/lib/push", () => ({
  isPushSupported: () => mockSupported(),
  getExistingSubscription: () => mockGetSub(),
  enablePush: () => mockEnable(),
  disablePush: () => mockDisable(),
}));

import { usePush } from "@/lib/use-push";

describe("usePush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupported.mockReturnValue(true);
    mockGetSub.mockResolvedValue(null);
    mockEnable.mockResolvedValue(undefined);
    mockDisable.mockResolvedValue(undefined);
    vi.stubGlobal("Notification", { permission: "granted" });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reports unsupported when the browser can't do push", () => {
    mockSupported.mockReturnValue(false);
    const { result } = renderHook(() => usePush());
    expect(result.current.supported).toBe(false);
  });

  it("initializes enabled=true when a subscription already exists", async () => {
    mockGetSub.mockResolvedValue({ endpoint: "https://push.example/abc" });
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.enabled).toBe(true));
  });

  it("enabling subscribes and flips enabled on", async () => {
    const { result } = renderHook(() => usePush());
    await act(async () => {
      await result.current.toggle(true);
    });
    expect(mockEnable).toHaveBeenCalledOnce();
    expect(result.current.enabled).toBe(true);
  });

  it("disabling unsubscribes and flips enabled off", async () => {
    mockGetSub.mockResolvedValue({ endpoint: "https://push.example/abc" });
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.enabled).toBe(true));
    await act(async () => {
      await result.current.toggle(false);
    });
    expect(mockDisable).toHaveBeenCalledOnce();
    expect(result.current.enabled).toBe(false);
  });

  it("propagates a denied error so the caller can toast", async () => {
    mockEnable.mockRejectedValue(new Error("denied"));
    const { result } = renderHook(() => usePush());
    await expect(
      act(async () => {
        await result.current.toggle(true);
      })
    ).rejects.toThrow("denied");
    expect(result.current.enabled).toBe(false);
  });
});
