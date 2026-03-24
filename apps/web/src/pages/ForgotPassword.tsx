import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } catch {
      // Intentionally swallow errors — we never reveal whether the email exists
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "28rem", margin: "2rem auto 0", padding: 0 }}>
      <h1 className="text-2xl font-semibold" style={{ marginBottom: "0.5rem", fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
        Forgot password
      </h1>

      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p className="text-muted-foreground" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <Link to="/login" className="text-primary" style={{ fontSize: "0.875rem" }}>
            Back to log in
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground" style={{ fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !email} className="w-full">
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
            <Link to="/login" className="text-muted-foreground" style={{ fontSize: "0.875rem", textAlign: "center" }}>
              Back to log in
            </Link>
          </form>
        </>
      )}
    </div>
  );
}
