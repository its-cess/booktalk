import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());
const mockApiPost = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Navigate: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: null, login: mockLogin }),
}));

vi.mock("@/lib/api", () => ({
  api: { post: mockApiPost },
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

import Login from "@/pages/Login";

describe("Login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders identifier and password inputs and a submit button", () => {
    const { container } = render(<Login />);
    expect(container.querySelectorAll("input")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows a validation error and does not call the API when submitted empty", async () => {
    render(<Login />);
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Email or username is required")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("calls the API, stores credentials, and navigates home on success", async () => {
    const authUser = { id: "1", email: "alice@example.com", username: "alice", displayName: "Alice" };
    mockApiPost.mockResolvedValueOnce({ data: { token: "tok123", user: authUser } });

    const { container } = render(<Login />);
    const [identifierInput, passwordInput] = container.querySelectorAll("input");

    await userEvent.type(identifierInput, "alice");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/auth/login", {
        identifier: "alice",
        password: "password123",
      });
      expect(mockLogin).toHaveBeenCalledWith("tok123", authUser);
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("shows an error toast when the API returns an error", async () => {
    mockApiPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Invalid credentials" } },
    });

    const { container } = render(<Login />);
    const [identifierInput, passwordInput] = container.querySelectorAll("input");

    await userEvent.type(identifierInput, "alice");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
    });
  });
});
