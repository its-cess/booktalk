import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating, { DnfBadge } from "@/components/ui/StarRating";

describe("StarRating", () => {
  it("read-only shows a DNF badge and no buttons when dnf", () => {
    render(<StarRating value={null} dnf readOnly />);
    expect(screen.getByText("DNF")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("read-only renders no interactive buttons", () => {
    render(<StarRating value={3.5} readOnly />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("interactive renders half-star hit targets and a DNF button", () => {
    render(<StarRating value={null} onChange={() => {}} onDnf={() => {}} />);
    expect(screen.getByRole("button", { name: "0.5 stars" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 stars" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DNF" })).toBeInTheDocument();
  });

  it("calls onChange with full and half values", async () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
    await userEvent.click(screen.getByRole("button", { name: "2.5 stars" }));
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("calls onDnf when DNF is clicked", async () => {
    const onDnf = vi.fn();
    render(<StarRating value={null} onChange={() => {}} onDnf={onDnf} />);
    await userEvent.click(screen.getByRole("button", { name: "DNF" }));
    expect(onDnf).toHaveBeenCalled();
  });

  it("shows Clear only when a value is set and calls onClear", async () => {
    const onClear = vi.fn();
    const { rerender } = render(<StarRating value={null} onChange={() => {}} onClear={onClear} />);
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();

    rerender(<StarRating value={3} onChange={() => {}} onClear={onClear} />);
    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalled();
  });

  it("DnfBadge renders the label", () => {
    render(<DnfBadge />);
    expect(screen.getByText("DNF")).toBeInTheDocument();
  });
});
