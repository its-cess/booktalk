import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS, type FeedbackType } from "@booktalk/shared";
import { useSendFeedback } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const sendFeedback = useSendFeedback();

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await sendFeedback.mutateAsync({
        type,
        message: trimmed,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      toast.success("Thanks for the feedback!");
      setMessage("");
      setType("bug");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't send feedback. Please try again.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40" style={{ position: "fixed", inset: 0, zIndex: 50 }} />
        <Dialog.Content
          className="bg-background rounded-sm shadow-lg"
          style={{
            position: "fixed",
            top: "18%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 2rem)",
            maxWidth: "32rem",
            zIndex: 51,
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <Dialog.Title className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600, fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
              Send feedback
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="text-muted-foreground hover:text-foreground" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-muted-foreground" style={{ fontSize: "0.8rem", marginBottom: "0.875rem" }}>
            Found a bug or have an idea? Let me know.
          </Dialog.Description>

          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            {FEEDBACK_TYPES.map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                size="sm"
                onClick={() => setType(t)}
              >
                {FEEDBACK_TYPE_LABELS[t]}
              </Button>
            ))}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            maxLength={2000}
            aria-label="Feedback message"
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.875rem" }}>
            <Button onClick={handleSubmit} disabled={sendFeedback.isPending || !message.trim()}>
              {sendFeedback.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
