"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemePreference } from "@/components/providers/ThemeProvider";

interface ThemeOption {
  value: ThemePreference;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "system",
    label: "Sistema",
    description: "Segue a preferência do sistema operacional",
    icon: <Monitor className="h-5 w-5" />
  },
  {
    value: "light",
    label: "Claro",
    description: "Sempre usa o tema claro",
    icon: <Sun className="h-5 w-5" />
  },
  {
    value: "dark",
    label: "Escuro",
    description: "Sempre usa o tema escuro",
    icon: <Moon className="h-5 w-5" />
  }
];

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700 dark:text-[var(--text-muted)]">
          Aparência
        </p>
        <p className="text-xs text-slate-500 dark:text-[var(--text-muted)]">
          Escolha como o Geklix aparece para você.
        </p>
      </div>

      <div className="space-y-2">
        {THEME_OPTIONS.map((option) => {
          const isSelected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                isSelected
                  ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-600/40 dark:bg-[var(--primary-subtle)] dark:text-brand-400"
                  : "border-slate-200/70 bg-white/90 text-slate-700 hover:border-brand-200 hover:bg-brand-50 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text)] dark:hover:border-brand-600/30 dark:hover:bg-[var(--primary-subtle)]"
              }`}
            >
              <span
                className={`shrink-0 ${
                  isSelected
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-slate-400 dark:text-[var(--text-muted)]"
                }`}
              >
                {option.icon}
              </span>
              <span className="flex min-w-0 flex-col items-start text-left">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-slate-500 dark:text-[var(--text-muted)]">
                  {option.description}
                </span>
              </span>
              {isSelected ? (
                <span className="ml-auto shrink-0 text-xs font-bold text-brand-600 dark:text-brand-400">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
