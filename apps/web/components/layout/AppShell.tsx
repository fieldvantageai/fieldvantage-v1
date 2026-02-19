"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import { useClientT } from "@/lib/i18n/useClientT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import FloatingActionButton from "../ui/FloatingActionButton";
import Sidebar from "./Sidebar";
import { ToastBanner } from "../ui/Toast";

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
  const [openMenu, setOpenMenu] = useState<"workspace" | "account" | null>(null);
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const switchTimeoutRef = useRef<number | null>(null);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [companies, setCompanies] = useState<
    Array<{ company_id: string; company_name: string; role: string }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inviteUnreadCount, setInviteUnreadCount] = useState(0);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const sidebarStorageKey = "fv_sidebar_collapsed";

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

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        workspaceMenuRef.current?.contains(target as Node) ||
        accountMenuRef.current?.contains(target as Node)
      ) {
        return;
      }
      setOpenMenu(null);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(sidebarStorageKey);
    if (stored === "1" || stored === "0") {
      setSidebarCollapsed(stored === "1");
      return;
    }
    setSidebarCollapsed(window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(sidebarStorageKey, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const companyLabel =
    companyName?.trim() || tCompanies("fallbackName");
  const companyInitial = companyLabel.charAt(0).toUpperCase();
  const showFab =
    pathname === "/dashboard" || pathname === "/jobs" || pathname === "/customers";
  const canSwitchCompany = companiesLoaded && companies.length > 1;

  const getInitials = (name?: string | null) => {
    if (!name) {
      return "--";
    }
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };
  const companyInitials = getInitials(companyLabel);
  const userInitials = getInitials(userName);

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
      console.log("User companies:", payload.data ?? []);
      console.log("Company count:", (payload.data ?? []).length);
    } finally {
      setCompaniesLoaded(true);
      setSwitcherLoading(false);
    }
  };

  const stopCompanySwitching = () => {
    setIsSwitchingCompany(false);
    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    window.dispatchEvent(
      new CustomEvent("fv-company-switching", {
        detail: { isSwitching: false }
      })
    );
  };

  const handleSwitchCompany = async (companyId: string) => {
    if (switchingCompanyId) {
      return;
    }
    if (companyId === userCompanyId) {
      setOpenMenu(null);
      return;
    }
    setSwitchingCompanyId(companyId);
    setToast(null);
    setIsSwitchingCompany(true);
    window.dispatchEvent(
      new CustomEvent("fv-company-switching", {
        detail: { isSwitching: true }
      })
    );
    try {
      const response = await fetch("/api/me/active-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId })
      });
      if (!response.ok) {
        setToast({
          message: tCompanies("selectCompany.selectError"),
          variant: "error"
        });
        stopCompanySwitching();
        return;
      }
      const nextCompany = companies.find((company) => company.company_id === companyId);
      if (nextCompany) {
        setCompanyName(nextCompany.company_name);
      }
      setUserCompanyId(companyId);
      setOpenMenu(null);
      router.refresh();
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
      }
      switchTimeoutRef.current = window.setTimeout(() => {
        stopCompanySwitching();
      }, 8000);
    } catch {
      setToast({
        message: tCompanies("selectCompany.selectError"),
        variant: "error"
      });
      stopCompanySwitching();
    } finally {
      setSwitchingCompanyId(null);
    }
  };

  useEffect(() => {
    const handler = () => {
      stopCompanySwitching();
    };
    window.addEventListener("fv-company-switching-complete", handler);
    return () => {
      window.removeEventListener("fv-company-switching-complete", handler);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
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
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                aria-label={t("nav.dashboard")}
                onClick={() => setIsOpen(false)}
              >
                <img
                  src="/brand/logo.png"
                  alt={t("appName")}
                  className="h-8 w-8 rounded-lg object-contain"
                />
                <span className="text-sm font-semibold text-slate-900">{t("appName")}</span>
              </Link>
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
              userRole={userRole}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <Sidebar
          className={`hidden lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:rounded-none lg:border-0 lg:border-r lg:border-slate-200/70 lg:bg-white/95 lg:shadow-none ${
            sidebarCollapsed ? "lg:w-20" : "lg:w-60"
          }`}
          userRole={userRole}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSwitchingCompany}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-slate-900 transition hover:bg-slate-50/70 ${
                      isSwitchingCompany ? "cursor-not-allowed opacity-70" : ""
                    }`}
                    onClick={() =>
                      setOpenMenu((prev) => (prev === "workspace" ? null : "workspace"))
                    }
                    aria-label={tCompanies("switcher.label")}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">
                        {isLoadingCompany ? t("status.loading") : companyLabel}
                      </span>
                      {isSwitchingCompany ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : null}
                      {isLoadingCompany ? (
                        <span className="h-7 w-7 animate-pulse rounded-full bg-slate-100" />
                      ) : companyLogoUrl ? (
                        <img
                          src={companyLogoUrl}
                          alt={companyLabel}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {companyInitials || companyInitial}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition ${
                        openMenu === "workspace" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((prev) => (prev === "account" ? null : "account"))
                    }
                    className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-2 py-1 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    aria-label={t("nav.profile")}
                  >
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={userName ?? t("status.loading")}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {userInitials}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition ${
                        openMenu === "account" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                {openMenu === "workspace" ? (
                  <div
                    ref={workspaceMenuRef}
                    className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-lg"
                  >
                    {canSwitchCompany ? (
                      <div className="space-y-2">
                        {switcherLoading ? (
                          <p className="px-2 text-xs text-slate-500">
                            {tCompanies("switcher.loading")}
                          </p>
                        ) : companies.length === 0 ? (
                          <p className="px-2 text-xs text-slate-500">
                            {tCompanies("switcher.empty")}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {companies.map((company) => {
                              const isActive = company.company_id === userCompanyId;
                              const isSwitching = switchingCompanyId === company.company_id;
                              return (
                                <button
                                  key={company.company_id}
                                  type="button"
                                  onClick={() => handleSwitchCompany(company.company_id)}
                                  disabled={switchingCompanyId !== null}
                                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition duration-150 ${
                                    isActive
                                      ? "border-brand-200 bg-brand-50 text-brand-700"
                                      : "border-slate-200/70 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                                  } ${switchingCompanyId !== null ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                  <div className="min-w-0">
                                    <span
                                      className={`block truncate text-sm ${
                                        isActive ? "font-semibold" : "font-medium"
                                      }`}
                                    >
                                      {company.company_name}
                                    </span>
                                    <span className="text-[10px] uppercase text-slate-400">
                                      {company.role}
                                    </span>
                                  </div>
                                  <div className="ml-3 flex h-5 w-5 items-center justify-center text-brand-600">
                                    {isSwitching ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isActive ? (
                                      <Check className="h-4 w-4" />
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="my-1 h-px bg-slate-200/70" />
                      </div>
                    ) : null}
                    {userRole === "owner" ? (
                      <Link
                        href="/settings/company"
                        className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        onClick={() => setOpenMenu(null)}
                      >
                        {tCompanies("title")}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                {openMenu === "account" ? (
                  <div
                    ref={accountMenuRef}
                    className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-lg"
                  >
                    <Link
                      href={userEmployeeId ? `/employees/${userEmployeeId}/edit` : "/employees"}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setOpenMenu(null)}
                    >
                      {t("nav.profile")}
                    </Link>
                    <Link
                      href="/settings"
                      className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setOpenMenu(null)}
                    >
                      {t("nav.settings")}
                    </Link>
                    <div className="my-1 h-px bg-slate-200/70" />
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                      onClick={async () => {
                        setOpenMenu(null);
                        await fetch("/api/auth/logout", { method: "POST" });
                        router.push("/entrar");
                        router.refresh();
                      }}
                    >
                      {t("actions.logout")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <main className="space-y-6">
              {toast ? (
                <ToastBanner
                  message={toast.message}
                  variant={toast.variant}
                  onClose={() => setToast(null)}
                />
              ) : null}
              {children}
            </main>
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
