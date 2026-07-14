import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, ChevronRight, Globe, Lock, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  useUserShelves,
  useCreateShelf,
  useRenameShelf,
  useDeleteShelf,
  useSetShelfPrivacy,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ShelfSummary } from "@booktalk/shared";

export default function ShelvesSection({
  username,
  isOwner,
}: {
  username: string;
  isOwner: boolean;
}) {
  const { data: shelves, isLoading } = useUserShelves(username);
  const createShelf = useCreateShelf();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createShelf.mutateAsync({ name });
      setNewName("");
      setCreating(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? "You already have a shelf with that name" : "Couldn't create shelf");
    }
  }

  if (isLoading || !shelves) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {isOwner && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {creating ? (
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", width: "100%" }}>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Shelf name"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
              />
              <Tooltip label="Create shelf">
                <Button variant="ghost" size="icon" className="text-primary" onClick={handleCreate} disabled={createShelf.isPending || !newName.trim()} aria-label="Create shelf">
                  <Check size={16} />
                </Button>
              </Tooltip>
              <Tooltip label="Cancel">
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setCreating(false); setNewName(""); }} aria-label="Cancel new shelf">
                  <X size={16} />
                </Button>
              </Tooltip>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setCreating(true)} className="gap-1 h-8">
              <Plus size={14} /> New shelf
            </Button>
          )}
        </div>
      )}

      {shelves.length === 0 ? (
        <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
          {isOwner ? "No shelves yet." : "No public shelves."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "65vh", overflowY: "auto" }}>
          {shelves.map((shelf) => (
            <ShelfRow key={shelf.id} shelf={shelf} username={username} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShelfRow({
  shelf,
  username,
  isOwner,
}: {
  shelf: ShelfSummary;
  username: string;
  isOwner: boolean;
}) {
  const renameShelf = useRenameShelf();
  const deleteShelf = useDeleteShelf();
  const setPrivacy = useSetShelfPrivacy();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shelf.name);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const previews = shelf.coverUrls.filter(Boolean).slice(0, 3) as string[];

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === shelf.name) {
      setEditing(false);
      setName(shelf.name);
      return;
    }
    try {
      await renameShelf.mutateAsync({ shelfId: shelf.id, name: trimmed });
      setEditing(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? "You already have a shelf with that name" : "Couldn't rename shelf");
    }
  }

  function togglePrivacy() {
    setPrivacy.mutate(
      { shelfId: shelf.id, isPrivate: !shelf.isPrivate },
      { onError: () => toast.error("Couldn't update privacy") }
    );
  }

  return (
    <div
      className="bg-background rounded-sm"
      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem" }}
    >
      {/* Cover strip */}
      <Link to={`/${username}/shelves/${shelf.id}`} style={{ flexShrink: 0, textDecoration: "none" }}>
        <div className="bg-muted/50 rounded-sm" style={{ display: "flex", gap: "1px", width: "140px", height: "108px", overflow: "hidden" }}>
          {previews.length === 0 ? (
            <div className="text-muted-foreground" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
              Empty
            </div>
          ) : (
            previews.map((url, i) => (
              <img key={i} src={url} alt="" style={{ flex: 1, minWidth: 0, height: "100%", objectFit: "cover" }} />
            ))
          )}
        </div>
      </Link>

      {/* Name + count */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="h-7"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setEditing(false); setName(shelf.name); }
              }}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={handleRename} aria-label="Save name">
              <Check size={14} />
            </Button>
          </div>
        ) : (
          <Link
            to={`/${username}/shelves/${shelf.id}`}
            className="text-foreground hover:underline"
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shelf.name}</span>
            {shelf.isPrivate && (
              <Tooltip label="Private">
                <Lock size={12} className="text-muted-foreground" style={{ flexShrink: 0 }} />
              </Tooltip>
            )}
          </Link>
        )}
        <span className="text-muted-foreground" style={{ fontSize: "0.72rem" }}>
          {shelf.itemCount} {shelf.itemCount === 1 ? "book" : "books"}
        </span>
      </div>

      {/* Owner options menu */}
      {isOwner && !editing && (
        <DropdownMenu>
          <Tooltip label="Options">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground flex-shrink-0" aria-label={`Options for ${shelf.name}`}>
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent align="end">
            {!shelf.isSystem && (
              <DropdownMenuItem className="gap-2" onSelect={() => setEditing(true)}>
                <Pencil size={13} /> Rename
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2" onSelect={togglePrivacy}>
              {shelf.isPrivate ? <Globe size={13} /> : <Lock size={13} />}
              {shelf.isPrivate ? "Make public" : "Make private"}
            </DropdownMenuItem>
            {!shelf.isSystem && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-destructive" onSelect={() => setConfirmOpen(true)}>
                  <Trash2 size={13} /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isOwner && (
        <Link to={`/${username}/shelves/${shelf.id}`} className="text-muted-foreground" style={{ flexShrink: 0, display: "flex" }} aria-label={`Open ${shelf.name}`}>
          <ChevronRight size={16} />
        </Link>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${shelf.name}"?`}
        description="This can't be undone. Your posts and ratings for these books aren't affected."
        confirmLabel="Delete"
        isPending={deleteShelf.isPending}
        onConfirm={() =>
          deleteShelf.mutate(shelf.id, {
            onSuccess: () => setConfirmOpen(false),
            onError: () => toast.error("Couldn't delete shelf"),
          })
        }
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
