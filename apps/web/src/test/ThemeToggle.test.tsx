import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSetTheme = vi.hoisted(() => vi.fn());
const mockUseTheme = vi.hoisted(() => vi.fn());

vi.mock("@/lib/theme-context", () => ({ useTheme: () => mockUseTheme() }));

import ThemeToggle from "@/components/ThemeToggle";
import { Switch } from "@/components/ui/switch";

describe("Switch", () => {
  it("exposes a switch role reflecting checked state and toggles", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} ariaLabel="Toggle" />);
    const sw = screen.getByRole("switch", { name: "Toggle" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows checked when on", () => {
    render(<Switch checked onCheckedChange={() => {}} ariaLabel="Toggle" />);
    expect(screen.getByRole("switch", { name: "Toggle" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is off in light mode and switches to dark on click", async () => {
    mockUseTheme.mockReturnValue({ theme: "light", setTheme: mockSetTheme, toggleTheme: vi.fn() });
    render(<ThemeToggle />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("is on in dark mode and switches to light on click", async () => {
    mockUseTheme.mockReturnValue({ theme: "dark", setTheme: mockSetTheme, toggleTheme: vi.fn() });
    render(<ThemeToggle />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    await userEvent.click(sw);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
