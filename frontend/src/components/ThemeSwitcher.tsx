"use client";

import { Sun, Moon } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-fjord-100 p-0.5 transition-colors duration-200 dark:bg-slate-800">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "rounded-md p-1.5 transition-all duration-200",
          resolvedTheme === "light"
            ? "bg-white text-amber-warm shadow-sm"
            : "text-fjord-400 hover:text-fjord-600 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "rounded-md p-1.5 transition-all duration-200",
          resolvedTheme === "dark"
            ? "bg-slate-700 text-amber-warm shadow-sm"
            : "text-fjord-400 hover:text-fjord-600 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
