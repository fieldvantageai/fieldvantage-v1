"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemePreference } from "@/components/providers/ThemeProvider";

const ICONS: Record<ThemePreference, React.ReactNode> = {
  system: <Monitor className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  light: <Sun className="h-4 w-4" />
};

const LABELS: Record<ThemePreference, string> = {
  system: "System",
  dark: "Dark",
  light: "Light"
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface2)] dark:hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      title={`Tema: ${LABELS[theme]} — clique para alternar`}
      aria-label={`Alternar tema (atual: ${LABELS[theme]})`}
    >
      {ICONS[theme]}
    </button>
  );
}
