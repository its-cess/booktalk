import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

function Harness() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("light")}>set-light</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <Harness />
    </ThemeProvider>
  );
}

describe("theme-context", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    // jsdom has no matchMedia — default to "light" system preference.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("defaults to light when nothing is stored and the system is light", () => {
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("reads a stored theme on init", () => {
    localStorage.setItem("theme", "dark");
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("toggling applies the dark class and persists it", async () => {
    renderProvider();
    await userEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("setting light removes the dark class and persists it", async () => {
    localStorage.setItem("theme", "dark");
    renderProvider();
    await userEvent.click(screen.getByText("set-light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
