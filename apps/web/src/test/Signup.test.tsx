import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());
const mockApiPost = vi.hoisted(() => vi.fn());

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
  toast: { error: vi.fn() },
}));

import Signup from "@/pages/Signup";

const VALID_FORM = {
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  password: "password123",
  confirmPassword: "password123",
};

async function fillForm(inputs: NodeListOf<Element>, overrides: Partial<typeof VALID_FORM> = {}) {
  const values = { ...VALID_FORM, ...overrides };
  const [email, username, displayName, password, confirmPassword] = inputs;
  await userEvent.type(email, values.email);
  await userEvent.type(username, values.username);
  await userEvent.type(displayName, values.displayName);
  await userEvent.type(password, values.password);
  await userEvent.type(confirmPassword, values.confirmPassword);
}

describe("Signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all five form fields and a submit button", () => {
    const { container } = render(<Signup />);
    expect(container.querySelectorAll("input")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows a validation error and does not call the API when passwords do not match", async () => {
    const { container } = render(<Signup />);
    await fillForm(container.querySelectorAll("input"), { confirmPassword: "different123" });
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("calls the API, stores credentials, and navigates home on success", async () => {
    const authUser = {
      id: "1",
      email: VALID_FORM.email,
      username: VALID_FORM.username,
      displayName: VALID_FORM.displayName,
    };
    mockApiPost.mockResolvedValueOnce({ data: { token: "tok123", user: authUser } });

    const { container } = render(<Signup />);
    await fillForm(container.querySelectorAll("input"));
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/auth/signup", {
        email: VALID_FORM.email,
        username: VALID_FORM.username,
        displayName: VALID_FORM.displayName,
        password: VALID_FORM.password,
      });
      expect(mockLogin).toHaveBeenCalledWith("tok123", authUser);
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
