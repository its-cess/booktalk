import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Minimal hover/focus tooltip. The bubble is rendered in a portal with fixed
 * positioning (computed from the trigger's rect), so it never affects an
 * ancestor's layout/overflow — no stray scrollbars, no clipping inside scroll
 * areas. Visual affordance only; triggers should keep their aria-label.
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; placement: "top" | "bottom" } | null>(null);

  function show() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Flip below if there isn't room above (e.g. triggers in the top header).
    const placement: "top" | "bottom" = side === "top" && r.top < 48 ? "bottom" : side;
    setCoords({
      left: r.left + r.width / 2,
      top: placement === "top" ? r.top - 6 : r.bottom + 6,
      placement,
    });
  }

  return (
    <span
      ref={ref}
      style={{ display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={() => setCoords(null)}
      onFocus={show}
      onBlur={() => setCoords(null)}
    >
      {children}
      {coords &&
        createPortal(
          <span
            role="tooltip"
            className="bg-foreground text-background rounded-sm shadow-sm"
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.top,
              transform: coords.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
              fontFamily: '"Zalando Sans SemiExpanded", sans-serif',
              fontSize: "0.7rem",
              fontWeight: 500,
              lineHeight: 1,
              padding: "0.25rem 0.45rem",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 60,
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
}
