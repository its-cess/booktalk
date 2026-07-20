import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockUpdateServiceWorker = vi.hoisted(() => vi.fn());
const mockUseRegisterSW = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() =>
  Object.assign(vi.fn(() => "toast-id"), { dismiss: vi.fn() })
);

vi.mock("virtual:pwa-register/react", () => ({ useRegisterSW: mockUseRegisterSW }));
vi.mock("sonner", () => ({ toast: mockToast }));

import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";

describe("PWAUpdatePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows no toast when there is no update waiting", () => {
    mockUseRegisterSW.mockReturnValue({
      needRefresh: [false, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    });
    render(<PWAUpdatePrompt />);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("shows a refresh toast when an update is available", () => {
    mockUseRegisterSW.mockReturnValue({
      needRefresh: [true, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    });
    render(<PWAUpdatePrompt />);
    expect(mockToast).toHaveBeenCalledWith(
      "A new version of BookTalk is available.",
      expect.objectContaining({ action: expect.objectContaining({ label: "Refresh" }) })
    );
  });

  it("calls updateServiceWorker(true) when the Refresh action is clicked", () => {
    mockUseRegisterSW.mockReturnValue({
      needRefresh: [true, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    });
    render(<PWAUpdatePrompt />);
    const options = (mockToast.mock.calls[0] as unknown[])[1] as { action: { onClick: () => void } };
    options.action.onClick();
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });
});
