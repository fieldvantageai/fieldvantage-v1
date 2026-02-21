"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

interface ThemedLogoProps {
  /** Show only the icon (square) — no wordmark */
  iconOnly?: boolean;
  className?: string;
  alt?: string;
}

export function ThemedLogo({
  iconOnly = false,
  className = "",
  alt = "Geklix"
}: ThemedLogoProps) {
  const { resolvedTheme } = useTheme();

  if (iconOnly) {
    return (
      <img
        src="/brand/icon.svg"
        alt={alt}
        className={className || "h-8 w-8 rounded-xl object-contain"}
      />
    );
  }

  return (
    <img
      src={resolvedTheme === "dark" ? "/brand/logo-dark.svg" : "/brand/logo-light.svg"}
      alt={alt}
      className={className || "h-8 object-contain"}
    />
  );
}
