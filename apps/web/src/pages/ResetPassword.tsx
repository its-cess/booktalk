import { useState } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  if (!token) return <Navigate to="/login" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      toast.success("Password reset! You can now log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "Failed to reset password.");
      } else {
        toast.error("Failed to reset password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "28rem", margin: "2rem auto 0", padding: 0 }}>
      <h1 className="text-2xl font-semibold" style={{ marginBottom: "0.5rem", fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
        Reset password
      </h1>
      <p className="text-muted-foreground" style={{ fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
            required
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !newPassword || !confirmPassword} className="w-full">
          {isSubmitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
