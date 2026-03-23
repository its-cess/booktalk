import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useChangePassword, useDeleteAccount } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      toast.error(msg === "Current password is incorrect" ? "Current password is incorrect." : "Failed to update password.");
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      logout();
      navigate("/");
    } catch {
      toast.error("Failed to delete account.");
    }
  }

  return (
    <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <h1 className="text-foreground" style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', margin: 0 }}>
        Settings
      </h1>

      {/* Account Info */}
      <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h2 className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          Account info
        </h2>
        <div className="bg-background rounded-sm" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid hsl(var(--border))" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Email</span>
            <span className="text-foreground" style={{ fontSize: "0.875rem" }}>{user?.email}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Username</span>
            <span className="text-foreground" style={{ fontSize: "0.875rem" }}>@{user?.username}</span>
          </div>
        </div>
      </section>

      {/* Change Password */}
      <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h2 className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          Change password
        </h2>
        <form
          onSubmit={handleChangePassword}
          className="bg-background rounded-sm"
          style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid hsl(var(--border))" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
            style={{ alignSelf: "flex-end" }}
          >
            {changePassword.isPending ? "Saving…" : "Update password"}
          </Button>
        </form>
      </section>

      {/* Danger Zone */}
      <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, color: "hsl(var(--destructive))" }}>
          Danger zone
        </h2>
        <div className="bg-background rounded-sm" style={{ padding: "1rem", border: "1px solid hsl(var(--destructive) / 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>Delete account</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
              Permanently delete your account and all associated data.
            </p>
          </div>
          <Button variant="destructive" size="sm" style={{ flexShrink: 0 }} onClick={() => setShowDeleteConfirm(true)}>
            Delete account
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete account"
        description="This will permanently delete your account and all associated posts, comments, and activity. This cannot be undone."
        confirmLabel="Delete account"
        isPending={deleteAccount.isPending}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
