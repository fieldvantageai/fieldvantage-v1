"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ToastBanner } from "@/components/ui/Toast";
import { useClientT } from "@/lib/i18n/useClientT";

type InviteItem = {
  id: string;
  read_at: string | null;
  created_at: string;
  invite: {
    id: string;
    status: string;
    expires_at: string | null;
    role: string | null;
    created_at: string | null;
    company_id: string;
    company?: { id: string; name: string } | null;
  } | null;
};

export default function InvitesInboxClient() {
  const { t } = useClientT("invites");
  const { t: tCommon } = useClientT("common");
  const router = useRouter();
  const [items, setItems] = useState<InviteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch("/api/invites/inbox", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(t("inbox.loadError"));
        }
        const payload = (await response.json()) as { data?: InviteItem[] };
        if (isMounted) {
          setItems(payload.data ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setToast({
            message: error instanceof Error ? error.message : t("inbox.loadError"),
            variant: "error"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) =>
        (right.created_at ?? "").localeCompare(left.created_at ?? "")
      ),
    [items]
  );

  const formatDate = (value?: string | null) => {
    if (!value) {
      return "--";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString();
  };

  const resolveRoleLabel = (role?: string | null) => {
    if (!role) {
      return tCommon("roles.member");
    }
    if (role === "owner") {
      return tCommon("roles.owner");
    }
    if (role === "admin") {
      return tCommon("roles.admin");
    }
    return tCommon("roles.member");
  };

  const handleAccept = async (notificationId: string) => {
    setActionId(notificationId);
    try {
      const response = await fetch("/api/invites/accept-by-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId })
      });
      const payload = (await response.json()) as { error?: string; redirect?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? t("inbox.actionError"));
      }
      setItems((prev) => prev.filter((item) => item.id !== notificationId));
      setToast({ message: t("inbox.acceptSuccess"), variant: "success" });
      window.dispatchEvent(new Event("fv-invites-read"));
      if (payload.redirect) {
        router.push(payload.redirect);
      } else {
        router.refresh();
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("inbox.actionError"),
        variant: "error"
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (notificationId: string) => {
    setActionId(notificationId);
    try {
      const response = await fetch("/api/invites/decline-by-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? t("inbox.actionError"));
      }
      setItems((prev) => prev.filter((item) => item.id !== notificationId));
      setToast({ message: t("inbox.declineSuccess"), variant: "info" });
      window.dispatchEvent(new Event("fv-invites-read"));
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("inbox.actionError"),
        variant: "error"
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <Section title={t("inbox.title")} description={t("inbox.subtitle")}>
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          closeLabel={tCommon("actions.close")}
        />
      ) : null}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
        </div>
      ) : sortedItems.length === 0 ? (
        <p className="text-sm text-slate-500">{t("inbox.empty")}</p>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const invite = item.invite;
            const companyName =
              invite?.company?.name ?? t("page.companyFallback");
            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{companyName}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>
                      {t("inbox.roleLabel")}: {resolveRoleLabel(invite?.role)}
                    </span>
                    <span>
                      {t("inbox.createdLabel")}: {formatDate(invite?.created_at)}
                    </span>
                    <span>
                      {t("inbox.expiresLabel")}: {formatDate(invite?.expires_at)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => handleAccept(item.id)}
                    disabled={actionId === item.id}
                  >
                    {t("inbox.accept")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleDecline(item.id)}
                    disabled={actionId === item.id}
                  >
                    {t("inbox.decline")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
