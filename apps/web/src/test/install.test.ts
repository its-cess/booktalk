import { describe, it, expect, vi, beforeEach } from "vitest";
import { canInstall, subscribe, promptInstall, isIOS } from "@/lib/install";

type FakeBIP = Event & { prompt: ReturnType<typeof vi.fn>; userChoice: Promise<{ outcome: string }> };

function fireBeforeInstallPrompt(outcome: "accepted" | "dismissed" = "accepted"): FakeBIP {
  const e = new Event("beforeinstallprompt") as FakeBIP;
  e.prompt = vi.fn().mockResolvedValue(undefined);
  e.userChoice = Promise.resolve({ outcome });
  window.dispatchEvent(e);
  return e;
}

describe("install capture", () => {
  beforeEach(() => {
    // Reset the module singleton between tests.
    window.dispatchEvent(new Event("appinstalled"));
  });

  it("has nothing to install by default", () => {
    expect(canInstall()).toBe(false);
  });

  it("captures beforeinstallprompt and notifies subscribers", () => {
    const cb = vi.fn();
    const unsub = subscribe(cb);
    fireBeforeInstallPrompt();
    expect(canInstall()).toBe(true);
    expect(cb).toHaveBeenCalled();
    unsub();
  });

  it("promptInstall triggers the native prompt and clears state", async () => {
    const e = fireBeforeInstallPrompt("accepted");
    const outcome = await promptInstall();
    expect(e.prompt).toHaveBeenCalledOnce();
    expect(outcome).toBe("accepted");
    expect(canInstall()).toBe(false);
  });

  it("promptInstall returns 'unavailable' when nothing was captured", async () => {
    expect(await promptInstall()).toBe("unavailable");
  });

  it("clears the captured prompt after the app is installed", () => {
    fireBeforeInstallPrompt();
    expect(canInstall()).toBe(true);
    window.dispatchEvent(new Event("appinstalled"));
    expect(canInstall()).toBe(false);
  });

  it("does not detect iOS in jsdom", () => {
    expect(isIOS()).toBe(false);
  });
});
