"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClientT } from "@/lib/i18n/useClientT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import FloatingActionButton from "../ui/FloatingActionButton";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useClientT("common");
  const { t: tCompanies } = useClientT("companies");
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userEmployeeId, setUserEmployeeId] = useState<string | null>(null);

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
        const userEmail = data.user?.email ?? null;
        const meta = data.user?.user_metadata as Record<string, string> | undefined;
        const resolvedName =
          meta?.owner_name ||
          meta?.full_name ||
          meta?.name ||
          userEmail ||
          null;
        const resolvedRole = meta?.role ?? null;
        if (isMounted) {
          setUserName(resolvedName);
          setUserRole(resolvedRole);
        }

        if (userEmail) {
          const response = await fetch("/api/employees", { cache: "no-store" });
          if (response.ok) {
            const payload = (await response.json()) as {
              data?: Array<{
                id: string;
                email?: string | null;
                full_name: string;
              }>;
            };
            const employees = payload.data ?? [];
            const match =
              employees.find(
                (employee) =>
                  employee.email?.toLowerCase() === userEmail.toLowerCase()
              ) ??
              employees.find(
                (employee) =>
                  resolvedName &&
                  employee.full_name?.toLowerCase() === resolvedName.toLowerCase()
              );
            if (match?.id && isMounted) {
              setUserEmployeeId(match.id);
              const detailResponse = await fetch(`/api/employees/${match.id}`, {
                cache: "no-store"
              });
              if (detailResponse.ok) {
                const detailPayload = (await detailResponse.json()) as {
                  data?: {
                    avatar_signed_url?: string | null;
                    avatar_url?: string | null;
                  };
                };
                const resolvedAvatar =
                  detailPayload.data?.avatar_signed_url ??
                  detailPayload.data?.avatar_url ??
                  null;
                setUserAvatarUrl(resolvedAvatar);
              }
            }
          }
        }
      } catch {
        if (isMounted) {
          setUserName(null);
          setUserRole(null);
          setUserAvatarUrl(null);
          setUserEmployeeId(null);
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
              <div className="flex min-w-0 items-center gap-3">
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {isLoadingCompany ? t("status.loading") : companyLabel}
                  </p>
                </div>
              </div>
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
              <Link
                href="/settings/company"
                className="flex min-w-0 items-center gap-3 text-left transition hover:opacity-90"
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
                </div>
              </Link>
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
