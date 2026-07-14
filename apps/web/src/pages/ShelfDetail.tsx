import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useShelf, useRemoveFromShelf, useAddToShelf } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import BookSearchBox from "@/components/book/BookSearchBox";

export default function ShelfDetail() {
  const { username, shelfId } = useParams<{ username: string; shelfId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shelf, isLoading, isError } = useShelf(shelfId!);
  const removeFromShelf = useRemoveFromShelf();
  const addToShelf = useAddToShelf();
  const [showAdd, setShowAdd] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAdd) return;
    function onMouseDown(e: MouseEvent) {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setShowAdd(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showAdd]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground" style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem", display: "flex", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (isError || !shelf) {
    return (
      <div className="text-destructive" style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem" }}>
        Shelf not found.
      </div>
    );
  }

  const isOwner = user?.id === shelf.owner.id;
  const addedIds = new Set(shelf.books.map((b) => b.id));

  function handleRemove(bookId: string) {
    removeFromShelf.mutate(
      { shelfId: shelf!.id, bookId },
      { onError: () => toast.error("Couldn't remove that book.") }
    );
  }

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <Button variant="ghost" size="sm" onClick={() => navigate(`/${username}?tab=shelves`)} className="text-muted-foreground mb-4 -ml-2 gap-1">
        <ArrowLeft size={15} />
        Back
      </Button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          className="text-foreground"
          style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: '"Zalando Sans SemiExpanded", sans-serif', lineHeight: 1.2, display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {shelf.name}
          {shelf.isPrivate && <Lock size={16} className="text-muted-foreground" />}
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
          <Link to={`/${shelf.owner.username}`} className="hover:underline">
            @{shelf.owner.username}
          </Link>
          {" · "}
          {shelf.books.length} {shelf.books.length === 1 ? "book" : "books"}
        </p>
      </div>

      {isOwner && (
        <div style={{ marginBottom: "1.5rem" }}>
          {showAdd ? (
            <div ref={addRef}>
              <BookSearchBox
                addedIds={addedIds}
                placeholder="Search books to add…"
                onSelect={(book) =>
                  addToShelf.mutate(
                    { shelfId: shelf.id, bookId: book.id },
                    {
                      onSuccess: () => toast.success(`Added "${book.title}"`),
                      onError: () => toast.error("Couldn't add that book."),
                    }
                  )
                }
              />
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add books
            </Button>
          )}
        </div>
      )}

      {shelf.books.length === 0 ? (
        <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>
          No books here yet
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: "1rem",
          }}
        >
          {shelf.books.map((book) => (
            <div key={book.id} style={{ position: "relative" }}>
              <Link to={`/books/${book.id}`} style={{ textDecoration: "none" }}>
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="rounded-sm"
                    style={{ width: "100%", aspectRatio: "2 / 3", objectFit: "cover", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", display: "block" }}
                  />
                ) : (
                  <div
                    className="bg-primary/10 text-primary rounded-sm"
                    style={{ width: "100%", aspectRatio: "2 / 3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.5rem" }}
                  >
                    {book.title[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="text-foreground" style={{ fontSize: "0.75rem", fontWeight: 500, marginTop: "0.375rem", lineHeight: 1.3 }}>
                  {book.title}
                </div>
                <div className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                  {book.author}
                </div>
              </Link>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(book.id)}
                  aria-label={`Remove ${book.title}`}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/55 text-white hover:bg-black/70"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
