"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const resolvedTheme = useMemo(() => theme === "system" ? systemTheme : theme, [systemTheme, theme]);
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showDarkIcon = mounted ? isDark : true;
  const showLightIcon = mounted ? !isDark : false;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-9 rounded-full border border-slate-200 bg-white shadow-sm transition hover:scale-105 dark:border-slate-700 dark:bg-slate-900"
    >
      <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
        <SunIcon
          className={cn(
            "h-4 w-4 transition-all duration-200",
            showDarkIcon
              ? "opacity-100 scale-100 rotate-0"
              : "absolute opacity-0 scale-0 -rotate-90",
          )}
        />
        <MoonIcon
          className={cn(
            "h-4 w-4 transition-all duration-200",
            showLightIcon
              ? "opacity-100 scale-100 rotate-0"
              : "absolute opacity-0 scale-0 rotate-90",
          )}
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

