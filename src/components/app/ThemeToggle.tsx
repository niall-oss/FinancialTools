import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const root = document.documentElement;
        root.classList.add("theme-switching");
        window.setTimeout(() => root.classList.remove("theme-switching"), 600);
        setTheme(isDark ? "light" : "dark");
      }}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
