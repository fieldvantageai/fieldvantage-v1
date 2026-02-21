"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** User-selected preference (system | light | dark) */
  theme: ThemePreference;
  /** Actual applied theme after resolving "system" */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  /** Cycles: system → dark → light → system */
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  cycleTheme: () => {}
});

const STORAGE_KEY = "fv_theme";
const CYCLE_ORDER: ThemePreference[] = ["system", "dark", "light"];

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme
): ResolvedTheme {
  if (preference === "system") return systemTheme;
  return preference;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  /* On mount: read persisted preference + detect system theme */
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) ?? "system") as ThemePreference;
    const validThemes: ThemePreference[] = ["system", "light", "dark"];
    const initial: ThemePreference = validThemes.includes(stored) ? stored : "system";

    const currentSystem = getSystemTheme();
    setSystemTheme(currentSystem);
    setThemeState(initial);
    applyTheme(resolveTheme(initial, currentSystem));
  }, []);

  /* Listen for system preference changes */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const newSystem: ResolvedTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSystem);
      setThemeState((prev) => {
        if (prev === "system") {
          applyTheme(newSystem);
        }
        return prev;
      });
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      setThemeState(next);
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(resolveTheme(next, systemTheme));
    },
    [systemTheme]
  );

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const idx = CYCLE_ORDER.indexOf(prev);
      const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(resolveTheme(next, systemTheme));
      return next;
    });
  }, [systemTheme]);

  const resolvedTheme = resolveTheme(theme, systemTheme);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
