import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries", () => ({
  useSendFeedback: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: mockToastSuccess, error: mockToastError } }));

import FeedbackDialog from "@/components/FeedbackDialog";

describe("FeedbackDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the selected type and message", async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const onOpenChange = vi.fn();
    render(<FeedbackDialog open onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Feature request" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Feedback message" }), "Add dark mode");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: "feature", message: "Add dark mode" })
      )
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("disables Send until there is a message", () => {
    render(<FeedbackDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
