import { useState, useEffect, useCallback } from "react";
import { isPushSupported, getExistingSubscription, enablePush, disablePush } from "./push";

export type PushState = {
  supported: boolean;
  enabled: boolean;
  loading: boolean;
  /** "granted" | "denied" | "default" — mirrors Notification.permission. */
  permission: NotificationPermission;
  toggle: (on: boolean) => Promise<void>;
};

// Owns the single master push on/off state for the Settings toggle.
export function usePush(): PushState {
  const [supported] = useState(isPushSupported);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "default"
  );

  useEffect(() => {
    if (!supported) return;
    getExistingSubscription()
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, [supported]);

  const toggle = useCallback(async (on: boolean) => {
    setLoading(true);
    try {
      if (on) {
        await enablePush();
        setEnabled(true);
      } else {
        await disablePush();
        setEnabled(false);
      }
    } finally {
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
      setLoading(false);
    }
  }, []);

  return { supported, enabled, loading, permission, toggle };
}
