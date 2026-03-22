import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { loginSchema, type LoginFormData } from "@booktalk/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    try {
      const res = await api.post("/auth/login", data);
      const { token, user: authUser } = res.data;
      login(token, authUser);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "Login failed");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Login failed");
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
        Log in
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <Label>Email or Username</Label>
          <Input {...register("identifier")} />
          {errors.identifier && (
            <p className="text-red-500 text-sm">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div>
          <Label>Password</Label>
          <Input type="password" {...register("password")} />
          {errors.password && (
            <p className="text-red-500 text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}
