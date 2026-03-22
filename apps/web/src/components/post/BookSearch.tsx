import { useEffect, useRef } from "react";
import { BookOpen, X } from "lucide-react";
import type { BookResult } from "@booktalk/shared";
import { useBookSearch } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SelectedBookChip({
  book,
  onRemove,
}: {
  book: BookResult;
  onRemove: () => void;
}) {
  return (
    <div
      className="bg-primary/5 border rounded-md"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.625rem",
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
          className="bg-primary/10"
          style={{
            width: "2rem",
            height: "3rem",
            borderRadius: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BookOpen size={14} className="text-primary" />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-foreground" style={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.3 }}>
          {book.title}
        </div>
        <div className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{book.author}</div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Remove book"
        className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <X size={14} />
      </Button>
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
    <div className="border rounded-md" style={{ overflow: "hidden" }}>
      {/* Search input */}
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search for a book..."
        className="rounded-none border-0 border-b"
      />

      {/* Results */}
      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
        {isFetching && debouncedQuery.length >= 2 && (
          <div className="text-muted-foreground" style={{ padding: "0.75rem 1rem", fontSize: "0.8rem" }}>
            Searching…
          </div>
        )}
        {!isFetching && debouncedQuery.length >= 2 && results?.length === 0 && (
          <div className="text-muted-foreground" style={{ padding: "0.75rem 1rem", fontSize: "0.8rem" }}>
            No results found.
          </div>
        )}
        {results?.map((book) => (
          <Button
            key={book.id}
            type="button"
            variant="ghost"
            onClick={() => onSelect(book)}
            className="w-full justify-start gap-2.5 rounded-none border-b px-3 py-2 h-auto"
            style={{ borderColor: "hsl(var(--muted))" }}
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                style={{ width: "1.75rem", height: "2.625rem", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
              />
            ) : (
              <div
                className="bg-muted"
                style={{
                  width: "1.75rem",
                  height: "2.625rem",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BookOpen size={12} className="text-muted-foreground" />
              </div>
            )}
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div className="text-foreground" style={{ fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.3 }}>
                {book.title}
              </div>
              <div className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{book.author}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Footer */}
      {onSwitchToManual && (
        <div className="border-t" style={{ padding: "0.375rem 0.5rem" }}>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onSwitchToManual}
            className="h-auto p-0 text-xs text-muted-foreground"
          >
            Can't find it? Add manually instead
          </Button>
        </div>
      )}
    </div>
  );
}
