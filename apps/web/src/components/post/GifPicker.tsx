import { useState, useEffect } from "react";
import { useGifSearch } from "@/lib/queries";

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
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: "0.5rem",
        width: 300,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* Search input */}
      <div style={{ padding: "0.5rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          autoFocus
          style={{
            width: "100%",
            border: "1px solid #e5e5e5",
            borderRadius: "0.375rem",
            padding: "0.375rem 0.5rem",
            fontSize: "0.875rem",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#4338ca")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
        />
      </div>

      {/* Results grid */}
      <div style={{ height: 240, overflowY: "auto", padding: "0 0.5rem" }}>
        {isFetching && (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#a3a3a3", padding: "1rem 0" }}>
            Loading…
          </p>
        )}
        {!isFetching && !debouncedQuery && (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#a3a3a3", padding: "1rem 0" }}>
            Search for GIFs above
          </p>
        )}
        {!isFetching && debouncedQuery && gifs && gifs.length === 0 && (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#a3a3a3", padding: "1rem 0" }}>
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
                  background: "#f5f5f5",
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
          borderTop: "1px solid #f0f0f0",
          textAlign: "right",
        }}
      >
        <span style={{ fontSize: "0.65rem", color: "#a3a3a3", letterSpacing: "0.02em" }}>
          Powered by GIPHY
        </span>
      </div>
    </div>
  );
}
