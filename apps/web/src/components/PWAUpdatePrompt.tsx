import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

// Watches for a newly deployed service worker and offers a one-tap refresh.
// registerType is "prompt", so a waiting worker never activates on its own —
// the user stays on their current version until they choose to update.
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Poll for a new build hourly so long-lived tabs still get the prompt.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    const id = toast("A new version of BookTalk is available.", {
      duration: Infinity,
      action: {
        label: "Refresh",
        onClick: () => updateServiceWorker(true),
      },
      onDismiss: () => setNeedRefresh(false),
    });
    return () => {
      toast.dismiss(id);
    };
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}
