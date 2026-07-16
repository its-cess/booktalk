import { useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MAX_TOP_BOOKS, type TopBook } from "@booktalk/shared";
import { useTopBooks, useSetTopBooks } from "@/lib/queries";
import BookSearchBox from "@/components/book/BookSearchBox";

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "1.25rem",
};

const CARD_BASE: React.CSSProperties = {
  width: "100%",
  maxWidth: "7.5rem",
  minWidth: 0,
  marginRight: "auto",
  border: "1px dashed hsl(var(--border))",
  borderRadius: "6px",
};

const TITLE_H = "1.6rem"; // ~2 lines
const AUTHOR_H = "0.8rem";

export default function TopBooks({ username, isOwner }: { username: string; isOwner: boolean }) {
  const { data: books, isLoading } = useTopBooks(username);
  const setTopBooks = useSetTopBooks(username);
  const [items, setItems] = useState<TopBook[]>(books ?? []);
  const [prevBooks, setPrevBooks] = useState(books);
  const [addOpen, setAddOpen] = useState(false);

  // Mouse: drag after an 8px move. Touch: long-press (200ms) so normal
  // finger-swipes still scroll the page and only a deliberate hold starts a drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Sync the working list when the server data changes (load or after a save).
  if (books !== prevBooks) {
    setPrevBooks(books);
    setItems(books ?? []);
  }

  if (isLoading || !books) return null;
  if (!isOwner && books.length === 0) return null;

  function commit(next: TopBook[]) {
    setItems(next);
    setTopBooks.mutate(
      next.map((b) => b.id),
      { onError: () => toast.error("Couldn't save your Top 8.") }
    );
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((b) => b.id === active.id);
      const newIndex = items.findIndex((b) => b.id === over.id);
      commit(arrayMove(items, oldIndex, newIndex));
    }
  }

  function addBook(book: TopBook) {
    if (items.length >= MAX_TOP_BOOKS || items.some((b) => b.id === book.id)) return;
    const next = [...items, { id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl }];
    commit(next);
    if (next.length >= MAX_TOP_BOOKS) setAddOpen(false);
  }

  const emptyCount = isOwner ? MAX_TOP_BOOKS - items.length : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
      <h2 className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
        Top 8
      </h2>

      {isOwner ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((b) => b.id)} strategy={rectSortingStrategy}>
            <div style={GRID_STYLE}>
              {items.map((book) => (
                <SortableCover key={book.id} book={book} onRemove={() => commit(items.filter((b) => b.id !== book.id))} />
              ))}
              {Array.from({ length: emptyCount }).map((_, i) => (
                <EmptySlot key={`empty-${i}`} onClick={() => setAddOpen(true)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={GRID_STYLE}>
          {books.map((book) => (
            <Link key={book.id} to={`/books/${book.id}`} style={{ textDecoration: "none" }}>
              <BookCell book={book} />
            </Link>
          ))}
        </div>
      )}

      {isOwner && (
        <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/40" style={{ position: "fixed", inset: 0, zIndex: 50 }} />
            <div style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "10vh 1rem 1rem", pointerEvents: "none" }}>
            <Dialog.Content
              className="bg-background rounded-sm shadow-lg"
              style={{ pointerEvents: "auto", width: "100%", maxWidth: "26rem", maxHeight: "80vh", overflowY: "auto", boxSizing: "border-box", padding: "1rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <Dialog.Title className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
                  Add to your Top 8
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button aria-label="Close" className="text-muted-foreground hover:text-foreground" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                    <X size={16} />
                  </button>
                </Dialog.Close>
              </div>
              <BookSearchBox onSelect={addBook} addedIds={new Set(items.map((b) => b.id))} placeholder="Search books…" />
            </Dialog.Content>
            </div>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

// Dashed card: centered title + author above a small cover.
function BookCell({ book, children }: { book: TopBook; children?: React.ReactNode }) {
  return (
    <div style={{ ...CARD_BASE, padding: "0.5rem 0.375rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
      <span
        className="text-foreground"
        style={{ fontSize: "0.66rem", fontWeight: 600, lineHeight: 1.2, textAlign: "center", height: TITLE_H, width: "100%", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {book.title}
      </span>
      <span className="text-muted-foreground" style={{ fontSize: "0.6rem", lineHeight: 1.2, height: AUTHOR_H, width: "100%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {book.author}
      </span>
      <div style={{ position: "relative", width: "100%", aspectRatio: "2 / 3" }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="rounded-sm" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }} />
        ) : (
          <div className="bg-primary/10 text-primary rounded-sm" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            {book.title[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add a book to your Top 8"
      className="text-muted-foreground hover:text-foreground"
      style={{ ...CARD_BASE, padding: "0.5rem 0.375rem", background: "transparent", cursor: "pointer", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}
    >
      <span aria-hidden style={{ height: TITLE_H, width: "100%" }} />
      <span aria-hidden style={{ height: AUTHOR_H, width: "100%" }} />
      <span aria-hidden style={{ width: "100%", aspectRatio: "2 / 3" }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Plus size={24} />
      </span>
    </button>
  );
}

function SortableCover({ book, onRemove }: { book: TopBook; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: book.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, cursor: "grab" }}
      {...attributes}
      {...listeners}
    >
      <BookCell book={book}>
        <button
          type="button"
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Remove ${book.title}`}
          className="rounded-full bg-black/55 text-white"
          style={{ position: "absolute", top: "3px", right: "3px", width: "20px", height: "20px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
        >
          <X size={12} />
        </button>
      </BookCell>
    </div>
  );
}
