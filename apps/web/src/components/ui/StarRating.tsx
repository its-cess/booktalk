import { useState } from "react";
import { Star } from "lucide-react";

const STAR_COLOR = "#f59e0b"; // amber

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Read-only "DNF" pill, also used inside StarRating when dnf is set. */
export function DnfBadge({ size = "0.7rem" }: { size?: string }) {
  return (
    <span
      className="bg-muted text-muted-foreground rounded-md"
      style={{ fontSize: size, fontWeight: 700, letterSpacing: "0.05em", padding: "0.1rem 0.4rem" }}
      aria-label="Did not finish"
      title="Did not finish"
    >
      DNF
    </span>
  );
}

function StarIcon({ fill, size }: { fill: number; size: number }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size, lineHeight: 0 }}>
      <Star size={size} className="text-muted-foreground/40" fill="none" strokeWidth={1.5} />
      {fill > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: size,
            width: `${fill * 100}%`,
            overflow: "hidden",
          }}
        >
          <Star size={size} style={{ color: STAR_COLOR }} fill={STAR_COLOR} strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}

interface StarRatingProps {
  /** Current star value 0–5 (in 0.5 steps). Ignored for display when dnf is true. */
  value: number | null;
  dnf?: boolean;
  readOnly?: boolean;
  size?: number;
  /** Called with 0.5–5 when a star half is chosen (interactive only). */
  onChange?: (value: number) => void;
  /** Toggle DNF on (interactive only). */
  onDnf?: () => void;
  /** Clear the rating entirely (interactive only). */
  onClear?: () => void;
}

export default function StarRating({
  value,
  dnf = false,
  readOnly = false,
  size = 22,
  onChange,
  onDnf,
  onClear,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  // Read-only DNF shows just the badge.
  if (readOnly && dnf) return <DnfBadge />;

  const shown = hover ?? (dnf ? 0 : value ?? 0);
  const hasRating = value != null || dnf;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <div
        role={readOnly ? undefined : "radiogroup"}
        aria-label={readOnly ? undefined : "Star rating"}
        style={{ display: "inline-flex", gap: "0.1rem" }}
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = clamp(shown - (i - 1), 0, 1);
          if (readOnly) return <StarIcon key={i} fill={fill} size={size} />;
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", width: size, height: size }}>
              <StarIcon fill={fill} size={size} />
              <button
                type="button"
                aria-label={`${i - 0.5} stars`}
                onClick={() => onChange?.(i - 0.5)}
                onMouseEnter={() => setHover(i - 0.5)}
                style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", padding: 0, border: "none", background: "none", cursor: "pointer" }}
              />
              <button
                type="button"
                aria-label={`${i} stars`}
                onClick={() => onChange?.(i)}
                onMouseEnter={() => setHover(i)}
                style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", padding: 0, border: "none", background: "none", cursor: "pointer" }}
              />
            </span>
          );
        })}
      </div>

      {!readOnly && (
        <>
          <button
            type="button"
            onClick={() => onDnf?.()}
            aria-pressed={dnf}
            className={dnf ? "bg-muted text-foreground rounded-md" : "text-muted-foreground rounded-md hover:bg-muted"}
            style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", padding: "0.2rem 0.45rem", border: "none", cursor: "pointer" }}
          >
            DNF
          </button>
          {hasRating && onClear && (
            <button
              type="button"
              onClick={() => onClear()}
              className="text-muted-foreground hover:text-foreground"
              style={{ fontSize: "0.72rem", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear
            </button>
          )}
        </>
      )}
    </div>
  );
}
