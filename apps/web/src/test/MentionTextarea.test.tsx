import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseUserSearch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useUserSearch: mockUseUserSearch,
}));

import MentionTextarea from "@/components/post/MentionTextarea";

const USERS = [
  { id: "u1", username: "alice", displayName: "Alice Smith" },
  { id: "u2", username: "albert", displayName: "Albert Jones" },
];

// Controlled wrapper so we can observe value changes
function Wrapper({ onChange }: { onChange?: (v: string) => void } = {}) {
  const [value, setValue] = useState("");
  return (
    <MentionTextarea
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
      placeholder="Type here"
    />
  );
}

describe("MentionTextarea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserSearch.mockReturnValue({ data: [] });
  });

  it("renders a textarea with the given placeholder", () => {
    render(<Wrapper />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("does not show a suggestion dropdown for regular text", async () => {
    render(<Wrapper />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "hello world");
    // No dropdown buttons should appear
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a dropdown with user results after typing @word", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    render(<Wrapper />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    expect(screen.getByRole("button", { name: /@alice/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /@albert/ })).toBeInTheDocument();
  });

  it("passes the typed word after @ as the query to useUserSearch", async () => {
    render(<Wrapper />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@bob");
    expect(mockUseUserSearch).toHaveBeenCalledWith("bob");
  });

  it("does not show a dropdown when useUserSearch returns no results", async () => {
    mockUseUserSearch.mockReturnValue({ data: [] });
    render(<Wrapper />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@nobody");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("clicking a suggestion closes the dropdown", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    render(<Wrapper />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    await userEvent.click(screen.getByRole("button", { name: /@alice/ }));
    expect(screen.queryByRole("button", { name: /@alice/ })).not.toBeInTheDocument();
  });

  it("clicking a suggestion replaces @partial with @username and a trailing space", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "Hey @al");
    await userEvent.click(screen.getByRole("button", { name: /@alice/ }));
    const finalValue = onChange.mock.calls.at(-1)![0];
    expect(finalValue).toBe("Hey @alice ");
  });

  it("Escape closes the dropdown without selecting", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    render(<Wrapper />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    expect(screen.getByRole("button", { name: /@alice/ })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: /@alice/ })).not.toBeInTheDocument();
  });

  it("Enter selects the currently highlighted suggestion", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    // First item is highlighted by default — press Enter
    await userEvent.keyboard("{Enter}");
    const finalValue = onChange.mock.calls.at(-1)![0];
    expect(finalValue).toContain("@alice");
  });

  it("ArrowDown moves highlight to the next item, Enter selects it", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    const finalValue = onChange.mock.calls.at(-1)![0];
    expect(finalValue).toContain("@albert");
  });

  it("ArrowUp does not go below index 0", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    // Press up when already at 0 — should stay on first item
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{Enter}");
    const finalValue = onChange.mock.calls.at(-1)![0];
    expect(finalValue).toContain("@alice");
  });

  it("does not fire onKeyDown for ArrowDown when dropdown is open", async () => {
    mockUseUserSearch.mockReturnValue({ data: USERS });
    const onKeyDown = vi.fn();
    const WithKeyDown = () => {
      const [v, setV] = useState("");
      return (
        <MentionTextarea
          value={v}
          onChange={setV}
          placeholder="Type here"
          onKeyDown={onKeyDown}
        />
      );
    };
    render(<WithKeyDown />);
    await userEvent.type(screen.getByPlaceholderText("Type here"), "@al");
    await userEvent.keyboard("{ArrowDown}");
    // ArrowDown should be intercepted by the dropdown, not passed to onKeyDown
    expect(onKeyDown).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "ArrowDown" })
    );
  });
});
