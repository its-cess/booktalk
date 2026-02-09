import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";

import { signupSchema, type SignupFormData } from "@booktalk/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function Signup() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      await api.post("/auth/signup", { email, username, displayName, password });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error ?? "Signup failed");
      } else {
        alert(err instanceof Error ? err.message : "Signup failed");
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-2xl font-bold">Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
