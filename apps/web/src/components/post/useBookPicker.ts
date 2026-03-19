import { useEffect, useState } from "react";
import type { BookResult } from "@booktalk/shared";

export type BookMode = "none" | "search" | "manual";

export function useBookPicker() {
  const [bookMode, setBookMode] = useState<BookMode>("none");
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function openSearch() {
    setBookMode("search");
  }

  function openManual() {
    setBookMode("manual");
    setSearchQuery("");
    setDebouncedQuery("");
  }

  function selectBook(book: BookResult) {
    setSelectedBook(book);
    setBookMode("none");
    setSearchQuery("");
    setDebouncedQuery("");
  }

  function clear() {
    setSelectedBook(null);
    setBookMode("none");
    setSearchQuery("");
    setDebouncedQuery("");
  }

  return {
    bookMode,
    setBookMode,
    selectedBook,
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    openSearch,
    openManual,
    selectBook,
    clear,
  };
}
