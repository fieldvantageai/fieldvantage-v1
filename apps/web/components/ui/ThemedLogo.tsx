"use client";

interface ThemedLogoProps {
  iconOnly?: boolean;
  className?: string;
  alt?: string;
}

export function ThemedLogo({
  iconOnly = false,
  className = "",
  alt = "Geklix"
}: ThemedLogoProps) {
  if (iconOnly) {
    return (
      <img
        src="/brand/fav-icon.png"
        alt={alt}
        className={className || "h-8 w-8 rounded-xl object-contain"}
      />
    );
  }

  return (
    <img
      src="/brand/logo.png"
      alt={alt}
      className={className || "h-8 object-contain"}
    />
  );
}
