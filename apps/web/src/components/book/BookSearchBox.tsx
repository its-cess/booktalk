import { useEffect, useState } from "react";
import { Check, Search } from "lucide-react";
import { useBookSearch } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import type { BookResult } from "@booktalk/shared";

/**
 * Debounced OpenLibrary book search with a results list. Calls onSelect with
 * the chosen book. Pass addedIds to mark books that are already added.
 */
export default function BookSearchBox({
  onSelect,
  addedIds,
  placeholder = "Search books…",
}: {
  onSelect: (book: BookResult) => void;
  addedIds?: Set<string>;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: books, isFetching } = useBookSearch(debounced);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ position: "relative" }}>
        <Search size={15} className="text-muted-foreground" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {debounced.length >= 2 && (
        <div className="bg-background rounded-sm" style={{ display: "flex", flexDirection: "column", maxHeight: "18rem", overflowY: "auto" }}>
          {isFetching && (!books || books.length === 0) ? (
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem", padding: "0.75rem" }}>Searching…</p>
          ) : books && books.length > 0 ? (
            books.map((book) => {
              const added = addedIds?.has(book.id);
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onSelect(book)}
                  className="hover:bg-muted/50 transition-colors"
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
                >
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" style={{ width: "36px", height: "54px", objectFit: "cover", flexShrink: 0, borderRadius: "2px" }} />
                  ) : (
                    <div className="bg-muted text-muted-foreground rounded-sm" style={{ width: "36px", height: "54px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700 }}>
                      {book.title[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-foreground" style={{ fontSize: "0.85rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                    <div className="text-muted-foreground" style={{ fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author}</div>
                  </div>
                  {added && <Check size={16} className="text-primary" style={{ flexShrink: 0 }} />}
                </button>
              );
            })
          ) : (
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem", padding: "0.75rem" }}>No books found.</p>
          )}
        </div>
      )}
    </div>
  );
}
