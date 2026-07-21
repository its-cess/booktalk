import { useEffect, useState } from "react";
import { canInstall, subscribe, promptInstall, isStandalone, isIOS } from "./install";

export type InstallState = {
  /** Chromium offered a prompt — the button can install in one tap. */
  installable: boolean;
  /** Already installed / running standalone. */
  standalone: boolean;
  /** iOS, where install is the manual Share → Add to Home Screen flow. */
  ios: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

export function useInstall(): InstallState {
  const [installable, setInstallable] = useState(canInstall);
  const [standalone] = useState(isStandalone);

  useEffect(() => subscribe(() => setInstallable(canInstall())), []);

  return { installable, standalone, ios: isIOS(), promptInstall };
}
