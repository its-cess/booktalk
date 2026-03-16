import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createPostSchema, type CreatePostData } from "@booktalk/shared";
import { useCreatePost } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PostComposer() {
  const [showBookFields, setShowBookFields] = useState(false);
  const createPost = useCreatePost();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", bookTitle: "", bookAuthor: "", hasSpoilers: false },
  });

  const content = watch("content");
  const hasSpoilers = watch("hasSpoilers");

  async function onSubmit(data: CreatePostData) {
    try {
      await createPost.mutateAsync({
        ...data,
        bookTitle: data.bookTitle || undefined,
        bookAuthor: data.bookAuthor || undefined,
      });
      reset();
      setShowBookFields(false);
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
        <textarea
          {...register("content")}
          placeholder="What are you reading?"
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            border: "1px solid #e5e5e5",
            borderRadius: "0.5rem",
            padding: "0.625rem 0.75rem",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "#171717",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#a3a3a3")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
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

      {/* Book fields (toggled) */}
      {showBookFields && (
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <Input {...register("bookTitle")} placeholder="Book title" style={{ flex: 1 }} />
          <Input {...register("bookAuthor")} placeholder="Author" style={{ flex: 1 }} />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setShowBookFields((v) => !v)}
          style={{
            fontSize: "0.8rem",
            padding: "0.3rem 0.625rem",
            borderRadius: "0.375rem",
            border: "1px solid #e5e5e5",
            background: showBookFields ? "#f0f0f0" : "none",
            cursor: "pointer",
            color: "#525252",
          }}
        >
          + Book
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
