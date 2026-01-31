"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ToastBanner } from "@/components/ui/Toast";
import { useClientT } from "@/lib/i18n/useClientT";

type DeleteEmployeeButtonProps = {
  employeeId: string;
};

export default function DeleteEmployeeButton({
  employeeId
}: DeleteEmployeeButtonProps) {
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t("messages.deleteConfirm"))) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload?.error ?? t("messages.deleteError"));
      }
      router.push("/employees");
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.deleteFallback"),
        variant: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {toast ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-64">
          <ToastBanner
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        aria-label={tCommon("actions.remove")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200/70 text-rose-600 transition hover:bg-rose-50/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 3v6m4-6v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}
