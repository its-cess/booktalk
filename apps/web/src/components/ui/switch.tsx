export function Switch({
  checked,
  onCheckedChange,
  ariaLabel,
  size = "md",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
}) {
  const d =
    size === "sm"
      ? { w: 30, h: 18, knob: 12, off: 3, on: 15 }
      : { w: 44, h: 26, knob: 20, off: 3, on: 21 };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      style={{
        position: "relative",
        width: d.w,
        height: d.h,
        borderRadius: 999,
        // Off = a clearly visible grey (so the white knob reads); On = primary.
        backgroundColor: checked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        transition: "background-color 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: (d.h - d.knob) / 2,
          left: checked ? d.on : d.off,
          width: d.knob,
          height: d.knob,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}
