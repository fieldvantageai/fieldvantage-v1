"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClientT } from "@/lib/i18n/useClientT";

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

  const navItems = useMemo(
    () => [
      { label: t("nav.dashboard"), href: "/dashboard" },
      { label: t("nav.jobs"), href: "/jobs" },
      { label: t("nav.customers"), href: "/customers" },
      { label: t("nav.employees"), href: "/employees" },
      { label: t("nav.settings"), href: "/settings" }
    ],
    [t]
  );

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

    loadCompany();

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 lg:hidden"
            onClick={() => setIsOpen(true)}
            aria-label={t("actions.openMenu")}
          >
            <span className="text-xl">☰</span>
          </button>
          <Link
            href="/settings/company"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {isLoadingCompany ? t("status.loading") : companyLabel}
              </p>
            </div>
          </Link>
          <div className="hidden h-11 w-11 lg:block" aria-hidden="true" />
        </div>
      </header>

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

      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:gap-8 lg:px-8 lg:py-8">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 space-y-6">{children}</main>
      </div>
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
