import * as React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helperText?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, name, className, ...props }, ref) => {
    const inputId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <label
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
          htmlFor={inputId}
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            borderColor: error ? undefined : "var(--border)",
          }}
          className={`min-h-[120px] w-full resize-y rounded-xl border px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:border-brand-600/70 dark:focus:ring-brand-600/20 ${
            error ? "border-rose-400 focus:border-rose-400 dark:border-rose-500/70" : ""
          } ${className ?? ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400" id={`${inputId}-error`}>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
