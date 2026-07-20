import { SunMoon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Tooltip label={isDark ? "Light mode" : "Dark mode"}>
      <span className="text-muted-foreground" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
        <SunMoon size={15} />
        <Switch
          size="sm"
          checked={isDark}
          onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
          ariaLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
      </span>
    </Tooltip>
  );
}
