import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useMyShelves,
  useAddToShelf,
  useRemoveFromShelf,
  useCreateShelf,
} from "@/lib/queries";
import type { ShelfMembership } from "@booktalk/shared";

export default function AddToShelfMenu({
  bookId,
  children,
}: {
  bookId: string;
  children: ReactNode;
}) {
  const { data: shelves } = useMyShelves(bookId);
  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();
  const createShelf = useCreateShelf();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  function toggle(shelf: ShelfMembership) {
    if (shelf.containsBook) {
      removeFromShelf.mutate(
        { shelfId: shelf.id, bookId },
        {
          onSuccess: () => toast.success(`Removed from ${shelf.name}`),
          onError: () => toast.error("Something went wrong"),
        }
      );
    } else {
      addToShelf.mutate(
        { shelfId: shelf.id, bookId },
        {
          onSuccess: () => toast.success(`Saved to ${shelf.name}`),
          onError: () => toast.error("Something went wrong"),
        }
      );
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      const shelf = await createShelf.mutateAsync({ name });
      await addToShelf.mutateAsync({ shelfId: shelf.id, bookId });
      toast.success(`Saved to ${name}`);
      setNewName("");
      setCreating(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? "You already have a shelf with that name" : "Couldn't create shelf");
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setCreating(false);
          setNewName("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {shelves?.map((s) => (
          <DropdownMenuItem
            key={s.id}
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault();
              toggle(s);
            }}
          >
            <Check size={14} style={{ opacity: s.containsBook ? 1 : 0 }} />
            {s.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {creating ? (
          <div
            style={{ display: "flex", gap: "0.375rem", padding: "0.25rem 0.5rem" }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Shelf name"
              maxLength={50}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary flex-shrink-0"
              onClick={handleCreate}
              disabled={createShelf.isPending || !newName.trim()}
              aria-label="Create shelf"
            >
              <Check size={16} />
            </Button>
          </div>
        ) : (
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setCreating(true);
            }}
          >
            <Plus size={14} /> New shelf
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
