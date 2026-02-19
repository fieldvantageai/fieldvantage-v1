"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2, Mail, RefreshCw, X } from "lucide-react";

import { ToastBanner } from "@/components/ui/Toast";
import { useClientT } from "@/lib/i18n/useClientT";

type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

type EmployeeInvitePanelProps = {
  employeeId: string;
  email?: string | null;
  invitationStatus?: InviteStatus | null;
  userId?: string | null;
  initialInviteStatus?: InviteStatus | null;
  initialInviteExpiresAt?: string | null;
};

const STATUS_STYLES: Record<InviteStatus, { bg: string; text: string; dot: string }> = {
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  revoked:  { bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  expired:  { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400"     },
};

export default function EmployeeInvitePanel({
  employeeId,
  email,
  invitationStatus,
  userId,
  initialInviteStatus,
  initialInviteExpiresAt,
}: EmployeeInvitePanelProps) {
  const { t } = useClientT("employees");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialInviteExpiresAt ?? null);
  const [status, setStatus] = useState<InviteStatus>(
    userId ? "accepted" : (initialInviteStatus ?? invitationStatus ?? "pending")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusLabel = useMemo(() => {
    if (status === "accepted") return t("detail.invite.statusAccepted");
    if (status === "revoked")  return t("detail.invite.statusRevoked");
    if (status === "expired")  return t("detail.invite.statusExpired");
    return t("detail.invite.statusPending");
  }, [status, t]);

  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  const handleRegenerate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/invites/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload?.error ?? t("detail.invite.regenerateError"));
      }
      const payload = (await response.json()) as {
        invite_link: string;
        invite: { expires_at: string };
      };
      setInviteLink(payload.invite_link);
      setExpiresAt(payload.invite.expires_at);
      setStatus("pending");
      setToast({ message: t("detail.invite.regenerateSuccess"), variant: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("detail.invite.regenerateError"),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/invites/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload?.error ?? t("detail.invite.revokeError"));
      }
      setStatus("revoked");
      setInviteLink(null);
      setExpiresAt(null);
      setToast({ message: t("detail.invite.revokeSuccess"), variant: "info" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("detail.invite.revokeError"),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const response = await fetch("/api/invites/resend-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setToast({ message: payload?.error ?? t("detail.invite.resendError"), variant: "error" });
      return;
    }
    setToast({
      message: payload?.message ?? t("detail.invite.resendPlaceholder"),
      variant: "info",
    });
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ message: t("detail.invite.copySuccess"), variant: "success" });
    } catch {
      setToast({ message: t("detail.invite.copyError"), variant: "error" });
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* Status row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {statusLabel}
          </span>
          {expiresAt ? (
            <span className="text-xs text-slate-500">
              {t("detail.invite.expiresLabel")}{" "}
              {new Date(expiresAt).toLocaleString()}
            </span>
          ) : null}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("detail.invite.regenerate")}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleRevoke}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
            {t("detail.invite.revoke")}
          </button>
          {email ? (
            <button
              type="button"
              onClick={handleResendEmail}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {t("detail.invite.resend")}
            </button>
          ) : null}
        </div>
      </div>

      {/* Invite link */}
      {inviteLink ? (
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-3">
          <p className="mb-1.5 text-xs font-medium text-slate-500">{t("detail.invite.linkLabel")}</p>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate font-mono text-xs text-slate-600">
                {inviteLink}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                copied
                  ? "bg-emerald-50 text-emerald-700"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : t("detail.invite.copy")}
            </button>
          </div>
        </div>
      ) : status === "pending" ? (
        <p className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-xs text-amber-700">
          {t("detail.invite.linkUnavailable")}
        </p>
      ) : null}
    </div>
  );
}
