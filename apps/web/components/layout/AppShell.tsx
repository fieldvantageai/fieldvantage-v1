"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useClientT } from "@/lib/i18n/useClientT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import FloatingActionButton from "../ui/FloatingActionButton";
import Sidebar from "./Sidebar";
import SidebarUserHeader from "./SidebarUserHeader";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useClientT("common");
  const { t: tCompanies } = useClientT("companies");
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userEmployeeId, setUserEmployeeId] = useState<string | null>(null);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [companies, setCompanies] = useState<
    Array<{ company_id: string; company_name: string; role: string }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inviteUnreadCount, setInviteUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCompany = async () => {
      try {
        const response = await fetch("/api/companies", { cache: "no-store" });
        if (!response.ok) {
          if (isMounted) {
            setCompanyName(null);
            setCompanyLogoUrl(null);
          }
          return;
        }
        const payload = (await response.json()) as {
          data?: {
            id: string;
            name: string;
            logo_url?: string | null;
            logo_signed_url?: string | null;
          };
        };
        if (!payload.data) {
          if (isMounted) {
            setCompanyName(null);
            setCompanyLogoUrl(null);
          }
          return;
        }

        const { name, logo_signed_url: signedUrl, logo_url: logoUrl } = payload.data;
        if (isMounted) {
          setCompanyName(name);
        }
        if (isMounted) {
          const resolved =
            signedUrl ??
            (logoUrl && logoUrl.startsWith("http") ? logoUrl : null);
          setCompanyLogoUrl(resolved);
        }
      } catch {
        if (isMounted) {
          setCompanyName(null);
          setCompanyLogoUrl(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCompany(false);
        }
      }
    };

    const loadUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        const meta = data.user?.user_metadata as Record<string, string> | undefined;
        if (isMounted) {
          setUserId(data.user?.id ?? null);
        }

        const meResponse = await fetch("/api/employees/me", {
          cache: "no-store"
        });
        if (meResponse.ok) {
          const payload = (await meResponse.json()) as {
            data?: {
              id: string;
              company_id: string;
              full_name: string;
              role: string;
              avatar_signed_url?: string | null;
              avatar_url?: string | null;
            };
          };
          const me = payload.data;
          if (me && isMounted) {
            setUserEmployeeId(me.id);
            setUserCompanyId(me.company_id);
            setUserName(me.full_name);
            setUserRole(me.role);
            setUserAvatarUrl(me.avatar_signed_url ?? me.avatar_url ?? null);
            return;
          }
        }

        const fallbackName =
          meta?.owner_name ||
          meta?.full_name ||
          meta?.name ||
          data.user?.email ||
          null;
        if (isMounted) {
          setUserName(fallbackName);
          setUserRole(meta?.role ?? null);
        }
      } catch {
        if (isMounted) {
          setUserName(null);
          setUserRole(null);
          setUserAvatarUrl(null);
          setUserEmployeeId(null);
          setUserCompanyId(null);
          setUserId(null);
        }
      }
    };

    loadCompany();
    loadUser();

    const handleCompanyUpdate = (event: Event) => {
      const custom = event as CustomEvent<{
        name?: string | null;
        logoUrl?: string | null;
      }>;
      if (custom.detail?.name) {
        setCompanyName(custom.detail.name);
      }
      if (custom.detail?.logoUrl !== undefined) {
        setCompanyLogoUrl(custom.detail.logoUrl ?? null);
      }
    };

    window.addEventListener("fv-company-updated", handleCompanyUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("fv-company-updated", handleCompanyUpdate);
    };
  }, []);

  const companyLabel =
    companyName?.trim() || tCompanies("fallbackName");
  const companyInitial = companyLabel.charAt(0).toUpperCase();
  const showFab =
    pathname === "/dashboard" || pathname === "/jobs" || pathname === "/customers";

  const activeThreadUserId =
    pathname && pathname.startsWith("/messages/")
      ? pathname.replace("/messages/", "").split("/")[0] || null
      : null;

  const refreshUnread = useCallback(async () => {
    try {
      const url = activeThreadUserId
        ? `/api/messages/unread?exclude_user_id=${activeThreadUserId}`
        : "/api/messages/unread";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { data?: { count?: number } };
      setUnreadCount(payload.data?.count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [activeThreadUserId]);

  const refreshInviteUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/invites/notifications/count", {
        cache: "no-store"
      });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { data?: { count?: number } };
      setInviteUnreadCount(payload.data?.count ?? 0);
    } catch {
      setInviteUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      refreshUnread();
    }
    const interval = setInterval(() => {
      if (isMounted) {
        refreshUnread();
      }
    }, 5000);
    const handler = () => {
      refreshUnread();
    };
    window.addEventListener("fv-messages-read", handler);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("fv-messages-read", handler);
    };
  }, [pathname, userCompanyId, refreshUnread]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      refreshInviteUnread();
    }
    const interval = setInterval(() => {
      if (isMounted) {
        refreshInviteUnread();
      }
    }, 10000);
    const handler = () => {
      refreshInviteUnread();
    };
    window.addEventListener("fv-invites-read", handler);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("fv-invites-read", handler);
    };
  }, [refreshInviteUnread]);

  useEffect(() => {
    if (!userId || !userCompanyId) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`messages-unread-${userCompanyId}-${userId}`);
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `company_id=eq.${userCompanyId}`
      },
      (payload) => {
        const record = payload.new as { recipient_user_id?: string | null };
        if (record?.recipient_user_id === userId) {
          const url = activeThreadUserId
            ? `/api/messages/unread?exclude_user_id=${activeThreadUserId}`
            : "/api/messages/unread";
          fetch(url, { cache: "no-store" })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload) => {
              if (payload?.data?.count !== undefined) {
                setUnreadCount(payload.data.count);
              }
            })
            .catch(() => null);
        }
      }
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userCompanyId, activeThreadUserId]);

  const loadCompanies = async () => {
    setSwitcherLoading(true);
    try {
      const response = await fetch("/api/me/companies", { cache: "no-store" });
      if (!response.ok) {
        setCompanies([]);
        return;
      }
      const payload = (await response.json()) as {
        data?: Array<{ company_id: string; company_name: string; role: string }>;
      };
      setCompanies(payload.data ?? []);
    } finally {
      setSwitcherLoading(false);
    }
  };

  const handleSwitchCompany = async (companyId: string) => {
    const response = await fetch("/api/me/active-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId })
    });
    if (response.ok) {
      setSwitcherOpen(false);
      router.refresh();
    }
  };
  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-3 left-3 w-[85vw] max-w-sm rounded-r-3xl bg-white/95 px-4 pb-3 pt-4 shadow-2xl ring-1 ring-slate-200/70 motion-safe:animate-[drawer-in_220ms_ease-out]">
            <div className="mb-5 flex items-center justify-between">
              <SidebarUserHeader
                userName={userName}
                userRole={userRole}
                userAvatarUrl={userAvatarUrl}
                companyName={isLoadingCompany ? null : companyLabel}
                companyLogoUrl={companyLogoUrl ?? null}
                variant="mobile"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500/80 transition hover:bg-slate-50/70 hover:text-slate-600"
                aria-label={t("actions.close")}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6l-12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <Sidebar
              className="w-full border-none p-0 shadow-none"
              onNavigate={() => setIsOpen(false)}
              showHeader={false}
              userRole={userRole}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <Sidebar
          className="hidden lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:rounded-none lg:border-0 lg:border-r lg:border-slate-200/70 lg:bg-white/95 lg:shadow-none"
          userName={userName}
          userRole={userRole}
          userAvatarUrl={userAvatarUrl}
          userEmployeeId={userEmployeeId}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 lg:hidden"
                  onClick={() => setIsOpen(true)}
                  aria-label={t("actions.openMenu")}
                >
                  <span className="text-xl">☰</span>
                </button>
                <div className="hidden items-center lg:flex">
                  <div className="w-full min-w-[240px] max-w-md">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path
                          d="M11 19a8 8 0 1 1 5.657-2.343L21 21"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder={t("actions.search")}
                        className="w-full bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative flex min-w-0 items-center gap-3 text-left">
                {inviteUnreadCount > 0 ? (
                  <Link
                    href="/invites"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-600 transition hover:text-brand-600"
                    aria-label={t("nav.invites")}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path
                        d="m4 7 8 6 8-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {inviteUnreadCount > 99 ? "99+" : inviteUnreadCount}
                    </span>
                  </Link>
                ) : null}
                <Link
                  href="/messages"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-600 transition hover:text-brand-600"
                  aria-label={t("nav.messages")}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M4 6h16v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="/settings/company"
                  className="flex items-center gap-3 transition hover:opacity-90"
                >
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt={companyLabel}
                      className="h-10 w-10 rounded-full border border-slate-200/70 object-cover shadow-sm"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white text-sm font-semibold text-slate-700 shadow-sm">
                      {companyInitial}
                    </span>
                  )}
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {isLoadingCompany ? t("status.loading") : companyLabel}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
                      onClick={async () => {
                        if (!switcherOpen) {
                          await loadCompanies();
                        }
                        setSwitcherOpen((value) => !value);
                      }}
                    >
                      {tCompanies("switcher.label")}
                    </button>
                  </div>
                </Link>
                {switcherOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-lg">
                    {switcherLoading ? (
                      <p className="text-xs text-slate-500">
                        {tCompanies("switcher.loading")}
                      </p>
                    ) : companies.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        {tCompanies("switcher.empty")}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {companies.map((company) => (
                          <button
                            key={company.company_id}
                            type="button"
                            onClick={() => handleSwitchCompany(company.company_id)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              company.company_id === userCompanyId
                                ? "border-brand-200 bg-brand-50 text-brand-700"
                                : "border-slate-200/70 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                            }`}
                          >
                            <span className="truncate">{company.company_name}</span>
                            <span className="text-[10px] uppercase text-slate-400">
                              {company.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <main className="space-y-6">{children}</main>
          </div>
        </div>
      </div>
      <FloatingActionButton isVisible={showFab} />
      <style jsx global>{`
        @keyframes drawer-in {
          from {
            transform: translateX(-12px);
            opacity: 0.96;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
