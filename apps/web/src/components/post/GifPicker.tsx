import { useState, useEffect } from "react";
import { useGifSearch } from "@/lib/queries";
import { Input } from "@/components/ui/input";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export default function GifPicker({ onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: gifs, isFetching } = useGifSearch(debouncedQuery);

  return (
    <div
      className="bg-background border rounded-sm"
      style={{
        width: 300,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* Search input */}
      <div style={{ padding: "0.5rem" }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          autoFocus
        />
      </div>

      {/* Results grid */}
      <div style={{ height: 240, overflowY: "auto", padding: "0 0.5rem" }}>
        {isFetching && (
          <p className="text-muted-foreground" style={{ textAlign: "center", fontSize: "0.8rem", padding: "1rem 0" }}>
            Loading…
          </p>
        )}
        {!isFetching && !debouncedQuery && (
          <p className="text-muted-foreground" style={{ textAlign: "center", fontSize: "0.8rem", padding: "1rem 0" }}>
            Search for GIFs above
          </p>
        )}
        {!isFetching && debouncedQuery && gifs && gifs.length === 0 && (
          <p className="text-muted-foreground" style={{ textAlign: "center", fontSize: "0.8rem", padding: "1rem 0" }}>
            No GIFs found.
          </p>
        )}
        {!isFetching && gifs && gifs.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.25rem",
              paddingBottom: "0.25rem",
            }}
          >
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif.gifUrl)}
                style={{
                  padding: 0,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "0.25rem",
                  overflow: "hidden",
                  background: "hsl(var(--muted) / 0.5)",
                  aspectRatio: "4/3",
                  display: "block",
                  width: "100%",
                  opacity: 1,
                  transition: "opacity 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Powered by GIPHY */}
      <div
        style={{
          padding: "0.375rem 0.5rem",
          borderTop: "1px solid hsl(var(--border))",
          textAlign: "right",
        }}
      >
        <span className="text-muted-foreground" style={{ fontSize: "0.65rem", letterSpacing: "0.02em" }}>
          Powered by GIPHY
        </span>
      </div>
    </div>
  );
}
