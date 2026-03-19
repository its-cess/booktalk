import { useEffect, useRef } from "react";
import { BookOpen, Search, X } from "lucide-react";
import type { BookResult } from "@booktalk/shared";
import { useBookSearch } from "@/lib/queries";

export function SelectedBookChip({
  book,
  onRemove,
}: {
  book: BookResult;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.625rem",
        backgroundColor: "#f5f3ff",
        border: "1px solid #e0d9ff",
        borderRadius: "0.5rem",
      }}
    >
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          style={{ width: "2rem", height: "3rem", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: "2rem",
            height: "3rem",
            backgroundColor: "#e0d9ff",
            borderRadius: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BookOpen size={14} style={{ color: "#7c3aed" }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#171717", lineHeight: 1.3 }}>
          {book.title}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#737373" }}>{book.author}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove book"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#a3a3a3",
          display: "flex",
          padding: "0.25rem",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#525252")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a3a3a3")}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function BookSearchPanel({
  query,
  debouncedQuery,
  onQueryChange,
  onSelect,
  onSwitchToManual,
}: {
  query: string;
  debouncedQuery: string;
  onQueryChange: (q: string) => void;
  onSelect: (book: BookResult) => void;
  onSwitchToManual?: () => void;
}) {
  const { data: results, isFetching } = useBookSearch(debouncedQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: "0.5rem", overflow: "hidden" }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#a3a3a3",
            pointerEvents: "none",
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for a book..."
          style={{
            width: "100%",
            padding: "0.625rem 0.75rem 0.625rem 2.25rem",
            border: "none",
            borderBottom: "1px solid #e5e5e5",
            outline: "none",
            fontSize: "0.875rem",
            color: "#171717",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Results */}
      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
        {isFetching && debouncedQuery.length >= 2 && (
          <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#a3a3a3" }}>
            Searching…
          </div>
        )}
        {!isFetching && debouncedQuery.length >= 2 && results?.length === 0 && (
          <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#a3a3a3" }}>
            No results found.
          </div>
        )}
        {results?.map((book) => (
          <button
            key={book.id}
            type="button"
            onClick={() => onSelect(book)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.75rem",
              border: "none",
              borderBottom: "1px solid #f5f5f5",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                style={{ width: "1.75rem", height: "2.625rem", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: "1.75rem",
                  height: "2.625rem",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BookOpen size={12} style={{ color: "#a3a3a3" }} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#171717", lineHeight: 1.3 }}>
                {book.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#737373" }}>{book.author}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      {onSwitchToManual && (
        <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid #f5f5f5" }}>
          <button
            type="button"
            onClick={onSwitchToManual}
            style={{
              fontSize: "0.75rem",
              color: "#737373",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
          >
            Can't find it? Add manually instead
          </button>
        </div>
      )}
    </div>
  );
}
