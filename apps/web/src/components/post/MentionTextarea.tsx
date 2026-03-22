import { useRef, useState, useEffect, useCallback } from "react";
import { useUserSearch } from "@/lib/queries";
import { Textarea } from "@/components/ui/textarea";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  onFocusStyle?: React.CSSProperties;
  onBlurStyle?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface MentionState {
  active: boolean;
  query: string;
  startIndex: number; // index of the '@' character in the string
}

const INACTIVE: MentionState = { active: false, query: "", startIndex: -1 };

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  disabled,
  style,
  onKeyDown,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mention, setMention] = useState<MentionState>(INACTIVE);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: searchResults = [] } = useUserSearch(mention.active ? mention.query : "");

  // Detect @mention trigger from cursor position
  const detectMention = useCallback(
    (text: string, cursorPos: number) => {
      const textBeforeCursor = text.slice(0, cursorPos);
      // Find the last @ that starts a word
      const match = textBeforeCursor.match(/@(\w*)$/);
      if (match) {
        const startIndex = textBeforeCursor.lastIndexOf("@");
        setMention({ active: true, query: match[1], startIndex });
        setSelectedIndex(0);
      } else {
        setMention(INACTIVE);
      }
    },
    []
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    onChange(newValue);
    detectMention(newValue, e.target.selectionStart ?? newValue.length);
  }

  function handleSelect(username: string) {
    // Replace the @query with @username followed by a space
    const before = value.slice(0, mention.startIndex);
    const after = value.slice(mention.startIndex + 1 + mention.query.length);
    const newValue = `${before}@${username} ${after}`;
    onChange(newValue);
    setMention(INACTIVE);

    // Restore focus and move cursor after the inserted mention
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const pos = before.length + username.length + 2; // @username + space
        ta.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention.active && searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelect(searchResults[selectedIndex].username);
        return;
      }
      if (e.key === "Escape") {
        setMention(INACTIVE);
        return;
      }
    }
    onKeyDown?.(e);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMention(INACTIVE);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = mention.active && searchResults.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        style={style}
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="bg-background border rounded-sm"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minWidth: "180px",
            maxWidth: "280px",
            overflow: "hidden",
            marginBottom: "0.25rem",
          }}
        >
          {searchResults.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                handleSelect(user.username);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.5rem 0.75rem",
                background: i === selectedIndex ? "hsl(var(--muted) / 0.5)" : "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="text-foreground" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                @{user.username}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                {user.displayName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
