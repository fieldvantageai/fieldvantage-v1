type ToastVariant = "success" | "error" | "info";

const variants: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-slate-200 bg-slate-50 text-slate-900"
};

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
  closeLabel?: string;
};

export function ToastBanner({
  message,
  variant = "info",
  onClose,
  closeLabel = "Fechar"
}: ToastProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-sm ${variants[variant]}`}
      role="status"
    >
      <span>{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-wide text-slate-700"
        >
          {closeLabel}
        </button>
      ) : null}
    </div>
  );
}
