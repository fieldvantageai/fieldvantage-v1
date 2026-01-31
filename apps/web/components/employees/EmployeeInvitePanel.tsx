"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
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

export default function EmployeeInvitePanel({
  employeeId,
  email,
  invitationStatus,
  userId,
  initialInviteStatus,
  initialInviteExpiresAt
}: EmployeeInvitePanelProps) {
  const { t } = useClientT("employees");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(
    initialInviteExpiresAt ?? null
  );
  const [status, setStatus] = useState<InviteStatus | null>(
    userId
      ? "accepted"
      : initialInviteStatus ?? invitationStatus ?? "pending"
  );
  const [isLoading, setIsLoading] = useState(false);

  const statusLabel = useMemo(() => {
    if (status === "accepted") {
      return t("detail.invite.statusAccepted");
    }
    if (status === "revoked") {
      return t("detail.invite.statusRevoked");
    }
    if (status === "expired") {
      return t("detail.invite.statusExpired");
    }
    return t("detail.invite.statusPending");
  }, [status, t]);

  const shortLink = inviteLink
    ? inviteLink.length > 48
      ? `${inviteLink.slice(0, 48)}…`
      : inviteLink
    : null;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
      {toast ? (
        <div className="mb-4">
          <ToastBanner
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">
            {t("detail.invite.title")}
          </p>
          <p className="text-sm text-slate-600">
            {t("detail.invite.statusLabel")}{" "}
            <span className="font-semibold text-brand-700">{statusLabel}</span>
          </p>
          {expiresAt ? (
            <p className="text-xs text-slate-500">
              {t("detail.invite.expiresLabel")}{" "}
              {new Date(expiresAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={async () => {
              try {
                setIsLoading(true);
                const response = await fetch("/api/invites/regenerate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ employee_id: employeeId })
                });
                if (!response.ok) {
                  const payload = (await response.json()) as { error?: string };
                  throw new Error(
                    payload?.error ?? t("detail.invite.regenerateError")
                  );
                }
                const payload = (await response.json()) as {
                  invite_link: string;
                  invite: { expires_at: string };
                };
                setInviteLink(payload.invite_link);
                setExpiresAt(payload.invite.expires_at);
                setStatus("pending");
                setToast({
                  message: t("detail.invite.regenerateSuccess"),
                  variant: "success"
                });
              } catch (error) {
                setToast({
                  message:
                    error instanceof Error
                      ? error.message
                      : t("detail.invite.regenerateError"),
                  variant: "error"
                });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {t("detail.invite.regenerate")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                setIsLoading(true);
                const response = await fetch("/api/invites/revoke", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ employee_id: employeeId })
                });
                if (!response.ok) {
                  const payload = (await response.json()) as { error?: string };
                  throw new Error(
                    payload?.error ?? t("detail.invite.revokeError")
                  );
                }
                setStatus("revoked");
                setInviteLink(null);
                setExpiresAt(null);
                setToast({
                  message: t("detail.invite.revokeSuccess"),
                  variant: "info"
                });
              } catch (error) {
                setToast({
                  message:
                    error instanceof Error
                      ? error.message
                      : t("detail.invite.revokeError"),
                  variant: "error"
                });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {t("detail.invite.revoke")}
          </Button>
          {email ? (
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                const response = await fetch("/api/invites/resend-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ employee_id: employeeId })
                });
                const payload = (await response.json()) as {
                  error?: string;
                  message?: string;
                };
                if (!response.ok) {
                  setToast({
                    message: payload?.error ?? t("detail.invite.resendError"),
                    variant: "error"
                  });
                  return;
                }
                setToast({
                  message:
                    payload?.message ?? t("detail.invite.resendPlaceholder"),
                  variant: "info"
                });
              }}
            >
              {t("detail.invite.resend")}
            </Button>
          ) : null}
        </div>
      </div>

      {shortLink ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-500">{t("detail.invite.linkLabel")}</p>
          <div className="rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 font-mono text-xs text-slate-600">
            {shortLink}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!inviteLink) {
                return;
              }
              try {
                await navigator.clipboard.writeText(inviteLink);
                setToast({
                  message: t("detail.invite.copySuccess"),
                  variant: "success"
                });
              } catch {
                setToast({
                  message: t("detail.invite.copyError"),
                  variant: "error"
                });
              }
            }}
          >
            {t("detail.invite.copy")}
          </Button>
        </div>
      ) : status === "pending" ? (
        <p className="mt-4 text-xs text-slate-500">
          {t("detail.invite.linkUnavailable")}
        </p>
      ) : null}
    </div>
  );
}
