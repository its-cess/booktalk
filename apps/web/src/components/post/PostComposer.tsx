import { useRef, useState, useEffect } from "react";
import { useBookPicker } from "./useBookPicker";
import { SelectedBookChip, BookSearchPanel } from "./BookSearch";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Smile, ImagePlay, X } from "lucide-react";
import { toast } from "sonner";
import { createPostSchema, type CreatePostData, type CreatePostInput } from "@booktalk/shared";
import { useCreatePost } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MentionTextarea from "./MentionTextarea";
import GifPicker from "./GifPicker";
import EmojiPicker, { type EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { SHOW_GIPHY } from "@/lib/config";

export default function PostComposer({ onSuccess }: { onSuccess?: () => void } = {}) {
  const picker = useBookPicker();
  const createPost = useCreatePost();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (gifPickerRef.current && !gifPickerRef.current.contains(e.target as Node)) {
        setShowGifPicker(false);
      }
    }
    if (showGifPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGifPicker]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreatePostInput, unknown, CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", bookTitle: "", bookAuthor: "", hasSpoilers: false },
  });

  const content = useWatch({ control, name: "content", defaultValue: "" });
  const hasSpoilers = useWatch({ control, name: "hasSpoilers", defaultValue: false });

  function handleBookButtonClick() {
    if (picker.bookMode !== "none" || picker.selectedBook) {
      picker.clear();
      setValue("bookTitle", "");
      setValue("bookAuthor", "");
    } else {
      picker.openSearch();
    }
  }

  function handleSwitchToManual() {
    picker.openManual();
  }

  async function onSubmit(data: CreatePostData) {
    try {
      await createPost.mutateAsync({
        content: data.content,
        hasSpoilers: data.hasSpoilers,
        ...(gifUrl && { gifUrl }),
        ...(picker.selectedBook
          ? { bookId: picker.selectedBook.id }
          : {
              bookTitle: data.bookTitle || undefined,
              bookAuthor: data.bookAuthor || undefined,
            }),
      });
      reset();
      picker.clear();
      setGifUrl(null);
      setValue("bookTitle", "");
      setValue("bookAuthor", "");
      toast.success("Post created!");
      onSuccess?.();
    } catch {
      toast.error("Failed to post. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-background rounded-sm"
      style={{
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        marginBottom: "0.5rem",
      }}
    >
      {/* Text area */}
      <div>
        <MentionTextarea
          value={content}
          onChange={(val) => setValue("content", val, { shouldValidate: true })}
          placeholder="What are you reading?"
          rows={3}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
          {errors.content ? (
            <span className="text-destructive" style={{ fontSize: "0.8rem" }}>{errors.content.message}</span>
          ) : (
            <span />
          )}
          <span className={content.length > 900 ? "text-destructive" : "text-muted-foreground"} style={{ fontSize: "0.75rem" }}>
            {content.length}/1000
          </span>
        </div>
      </div>

      {/* GIF preview */}
      {gifUrl && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={gifUrl}
            alt="Selected GIF"
            style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "0.5rem", display: "block" }}
          />
          <button
            type="button"
            onClick={() => setGifUrl(null)}
            aria-label="Remove GIF"
            className="rounded-full text-white"
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "20px",
              height: "20px",
              backgroundColor: "rgba(0,0,0,0.55)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Selected book chip */}
      {picker.selectedBook && (
        <SelectedBookChip book={picker.selectedBook} onRemove={picker.clear} />
      )}

      {/* Book search panel */}
      {picker.bookMode === "search" && (
        <BookSearchPanel
          query={picker.searchQuery}
          debouncedQuery={picker.debouncedQuery}
          onQueryChange={picker.setSearchQuery}
          onSelect={picker.selectBook}
          onSwitchToManual={handleSwitchToManual}
        />
      )}

      {/* Manual book fields */}
      {picker.bookMode === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <Input {...register("bookTitle")} placeholder="Book title" style={{ flex: 1 }} />
            <Input {...register("bookAuthor")} placeholder="Author" style={{ flex: 1 }} />
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground self-start"
            onClick={() => {
              picker.openSearch();
              setValue("bookTitle", "");
              setValue("bookAuthor", "");
            }}
          >
            ← Search instead
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: "3rem", zIndex: 50 }}
          >
            <EmojiPicker
              onEmojiClick={(data: EmojiClickData) => {
                setValue("content", content + data.emoji, { shouldValidate: true });
                setShowEmojiPicker(false);
              }}
              emojiStyle={EmojiStyle.GOOGLE}
              previewConfig={{ showPreview: false }}
              height={350}
              width={300}
              style={{ "--epr-emoji-size": "22px", "--epr-emoji-padding": "4px", "--epr-category-navigation-button-size": "22px" } as React.CSSProperties}
            />
          </div>
        )}

        {SHOW_GIPHY && showGifPicker && (
          <div
            ref={gifPickerRef}
            style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: "4.5rem", zIndex: 50 }}
          >
            <GifPicker
              onSelect={(url) => {
                setGifUrl(url);
                setShowGifPicker(false);
              }}
            />
          </div>
        )}

        {/* Spoilers */}
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="hasSpoilers"
            checked={hasSpoilers}
            onCheckedChange={(checked) => setValue("hasSpoilers", checked === true)}
          />
          <Label htmlFor="hasSpoilers" className="text-xs font-normal cursor-pointer">
            Spoilers?
          </Label>
        </div>

        {/* Book */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBookButtonClick}
          aria-label={picker.selectedBook || picker.bookMode !== "none" ? "Remove book" : "Add book"}
          className={picker.bookMode !== "none" || picker.selectedBook ? "bg-muted" : ""}
        >
          <BookOpen size={15} />
        </Button>

        {/* Emoji */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker((v) => !v)}
          aria-label="Insert emoji"
          className={showEmojiPicker ? "bg-muted" : ""}
        >
          <Smile size={15} />
        </Button>

        {/* GIF */}
        {SHOW_GIPHY && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowGifPicker((v) => !v)}
            aria-label="Insert GIF"
            className={showGifPicker ? "bg-muted" : ""}
          >
            <ImagePlay size={15} />
          </Button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={createPost.isPending || content.trim().length === 0}
          style={{ marginLeft: "auto" }}
        >
          {createPost.isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
