import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { signupSchema, type SignupFormData } from "@booktalk/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function Signup() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(data: SignupFormData) {
    try {
      const { email, username, displayName, password } = data;
      const res = await api.post("/auth/signup", { email, username, displayName, password });
      const { token, user: newUser } = res.data;
      login(token, newUser);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "Signup failed");
      } else {
        toast.error(err instanceof Error ? err.message : "Signup failed");
      }
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "28rem",
        margin: "2rem auto 0",
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      <h1 className="text-2xl font-bold" style={{ marginBottom: "1.5rem", fontFamily: '"Poppins", system-ui, sans-serif' }}>
        Create an account
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <Label>Email</Label>
          <Input {...register("email")} />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label>Username</Label>
          <Input {...register("username")} />
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username.message}</p>
          )}
        </div>

        <div>
          <Label>Display name</Label>
          <Input {...register("displayName")} />
        </div>

        <div>
          <Label>Password</Label>
          <Input type="password" {...register("password")} />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label>Confirm password</Label>
          <Input type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account…" : "Sign up"}
        </Button>
      </form>
    </div>
  );
}
