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
import MentionTextarea from "./MentionTextarea";
import GifPicker from "./GifPicker";
import EmojiPicker, { type EmojiClickData, EmojiStyle } from "emoji-picker-react";

export default function PostComposer() {
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
    } catch {
      toast.error("Failed to post. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: "0.75rem",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        marginBottom: "1.5rem",
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
            <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>{errors.content.message}</span>
          ) : (
            <span />
          )}
          <span style={{ fontSize: "0.75rem", color: content.length > 900 ? "#ef4444" : "#a3a3a3" }}>
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
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.55)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              color: "#ffffff",
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
          <button
            type="button"
            onClick={() => {
              picker.openSearch();
              setValue("bookTitle", "");
              setValue("bookAuthor", "");
            }}
            style={{
              fontSize: "0.75rem",
              color: "#737373",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
              width: "fit-content",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
          >
            ← Search instead
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: 0, zIndex: 50 }}
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

        <button
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          style={{
            fontSize: "0.8rem",
            padding: "0.3rem 0.5rem",
            borderRadius: "0.375rem",
            border: "1px solid #e5e5e5",
            background: showEmojiPicker ? "#f0f0f0" : "none",
            cursor: "pointer",
            color: "#525252",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Insert emoji"
        >
          <Smile size={15} />
        </button>

        {showGifPicker && (
          <div
            ref={gifPickerRef}
            style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: "2.5rem", zIndex: 50 }}
          >
            <GifPicker
              onSelect={(url) => {
                setGifUrl(url);
                setShowGifPicker(false);
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowGifPicker((v) => !v)}
          style={{
            fontSize: "0.8rem",
            padding: "0.3rem 0.5rem",
            borderRadius: "0.375rem",
            border: "1px solid #e5e5e5",
            background: showGifPicker ? "#f0f0f0" : "none",
            cursor: "pointer",
            color: "#525252",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Insert GIF"
        >
          <ImagePlay size={15} />
        </button>

        <button
          type="button"
          onClick={handleBookButtonClick}
          style={{
            fontSize: "0.8rem",
            padding: "0.3rem 0.625rem",
            borderRadius: "0.375rem",
            border: "1px solid #e5e5e5",
            background: picker.bookMode !== "none" || picker.selectedBook ? "#f0f0f0" : "none",
            cursor: "pointer",
            color: "#525252",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <BookOpen size={13} />
          {picker.selectedBook || picker.bookMode !== "none" ? "Remove book" : "+ Book"}
        </button>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.8rem",
            color: "#525252",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={hasSpoilers}
            onChange={(e) => setValue("hasSpoilers", e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          Spoilers?
        </label>

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
