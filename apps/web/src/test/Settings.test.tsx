import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseChangePassword = vi.hoisted(() => vi.fn());
const mockUseDeleteAccount = vi.hoisted(() => vi.fn());
const mockChangeMutateAsync = vi.hoisted(() => vi.fn());
const mockDeleteMutateAsync = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/queries", () => ({
  useChangePassword: mockUseChangePassword,
  useDeleteAccount: mockUseDeleteAccount,
}));
vi.mock("sonner", () => ({ toast: { success: mockToastSuccess, error: mockToastError } }));
vi.mock("@/components/FeedbackDialog", () => ({ default: () => null }));
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

const mockUsePush = vi.hoisted(() => vi.fn());
const mockPushToggle = vi.hoisted(() => vi.fn());
vi.mock("@/lib/use-push", () => ({ usePush: () => mockUsePush() }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import Settings from "@/pages/Settings";

const MOCK_USER = { id: "user-1", username: "alice", displayName: "Alice", email: "alice@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: MOCK_USER, logout: mockLogout });
  mockUseChangePassword.mockReturnValue({ mutateAsync: mockChangeMutateAsync, isPending: false });
  mockUseDeleteAccount.mockReturnValue({ mutateAsync: mockDeleteMutateAsync, isPending: false });
  mockPushToggle.mockResolvedValue(undefined);
  mockUsePush.mockReturnValue({
    supported: true,
    enabled: false,
    loading: false,
    permission: "default",
    toggle: mockPushToggle,
  });
});

describe("Settings — account info", () => {
  it("shows the user's email and username", () => {
    render(<Settings />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
  });
});

describe("Settings — change password", () => {
  it("renders the change password form", () => {
    render(<Settings />);
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update password" })).toBeInTheDocument();
  });

  it("disables the submit button when fields are empty", () => {
    render(<Settings />);
    expect(screen.getByRole("button", { name: "Update password" })).toBeDisabled();
  });

  it("shows an error toast when new passwords don't match", async () => {
    render(<Settings />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpass2");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(mockToastError).toHaveBeenCalledWith("New passwords don't match.");
    expect(mockChangeMutateAsync).not.toHaveBeenCalled();
  });

  it("calls mutateAsync and shows success toast on valid submit", async () => {
    mockChangeMutateAsync.mockResolvedValueOnce(undefined);
    render(<Settings />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpass123");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    await waitFor(() => {
      expect(mockChangeMutateAsync).toHaveBeenCalledWith({ currentPassword: "oldpass", newPassword: "newpass123" });
      expect(mockToastSuccess).toHaveBeenCalledWith("Password updated.");
    });
  });

  it("clears the form after a successful password change", async () => {
    mockChangeMutateAsync.mockResolvedValueOnce(undefined);
    render(<Settings />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpass123");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Current password")).toHaveValue("");
      expect(screen.getByLabelText("New password")).toHaveValue("");
      expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
    });
  });

  it("shows 'incorrect password' toast when API returns that error", async () => {
    mockChangeMutateAsync.mockRejectedValueOnce({ response: { data: { error: "Current password is incorrect" } } });
    render(<Settings />);
    await userEvent.type(screen.getByLabelText("Current password"), "wrongpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpass123");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Current password is incorrect.");
    });
  });

  it("shows a generic error toast for other failures", async () => {
    mockChangeMutateAsync.mockRejectedValueOnce(new Error("Network error"));
    render(<Settings />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpass123");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to update password.");
    });
  });
});

describe("Settings — push notifications", () => {
  it("shows the push toggle and enables on click", async () => {
    render(<Settings />);
    const toggle = screen.getByRole("switch", { name: "Toggle push notifications" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    await waitFor(() => {
      expect(mockPushToggle).toHaveBeenCalledWith(true);
      expect(mockToastSuccess).toHaveBeenCalledWith("Push notifications enabled.");
    });
  });

  it("shows a 'denied' error toast when the browser blocks permission", async () => {
    mockPushToggle.mockRejectedValueOnce(new Error("denied"));
    render(<Settings />);
    await userEvent.click(screen.getByRole("switch", { name: "Toggle push notifications" }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Notifications are blocked. Enable them in your browser settings.");
    });
  });

  it("hides the section when push isn't supported", () => {
    mockUsePush.mockReturnValue({ supported: false, enabled: false, loading: false, permission: "default", toggle: mockPushToggle });
    render(<Settings />);
    expect(screen.queryByRole("switch", { name: "Toggle push notifications" })).not.toBeInTheDocument();
  });

  it("disables the toggle and shows a hint when permission is denied", () => {
    mockUsePush.mockReturnValue({ supported: true, enabled: false, loading: false, permission: "denied", toggle: mockPushToggle });
    render(<Settings />);
    expect(screen.getByRole("switch", { name: "Toggle push notifications" })).toBeDisabled();
    expect(screen.getByText(/Blocked in your browser/i)).toBeInTheDocument();
  });
});

describe("Settings — delete account", () => {
  it("shows the delete account button", () => {
    render(<Settings />);
    expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument();
  });

  it("opens the confirmation dialog when Delete account is clicked", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.getByText("This will permanently delete your account and all associated posts, comments, and activity. This cannot be undone.")).toBeInTheDocument();
  });

  it("closes the dialog without deleting when Cancel is clicked", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("calls mutateAsync, logs out, and navigates to '/' on confirm", async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce(undefined);
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Delete account" })[1]);
    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows an error toast and does not log out when deletion fails", async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error("Server error"));
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Delete account" })[1]);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete account.");
    });
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
