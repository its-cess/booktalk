import { createPortal } from "react-dom";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-popover"
        style={{
          borderRadius: "0.75rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "22rem",
          margin: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        <h3 className="text-popover-foreground" style={{ fontSize: "1rem", fontWeight: 600, margin: 0, fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
          {title}
        </h3>
        <p className="text-muted-foreground" style={{ fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>
          {description}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
