import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormData } from "../schemas/auth";
import { api } from "../lib/api";

import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";
import { Label } from "../components/components/ui/label";

export default function Login() {
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

  async function onSubmit(data: LoginFormData) {
    try {
      const res = await api.post("/login", data);
      console.log("Login success:", res.data);

      // later:
      // - store token
      // - set auth context
      // - redirect
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Signup failed");
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-2xl font-bold">Log in</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
