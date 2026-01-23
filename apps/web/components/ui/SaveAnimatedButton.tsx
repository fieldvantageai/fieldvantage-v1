import * as React from "react";

type SaveAnimatedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
};

export function SaveAnimatedButton({
  isLoading,
  label = "Salvar",
  loadingLabel = "Salvando...",
  className,
  ...props
}: SaveAnimatedButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
        isLoading ? "opacity-80" : ""
      } ${className ?? ""}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
