"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
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
        const response = await fetch("/api/companies");
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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 lg:px-8">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
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
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700">
                {companyInitial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {isLoadingCompany ? t("status.loading") : companyLabel}
              </p>
              <p className="text-xs text-slate-500">{t("nav.settings")}</p>
            </div>
          </Link>
          <div className="hidden h-11 w-11 lg:block" aria-hidden="true" />
        </div>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {t("appName")}
              </p>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                {t("actions.close")}
              </Button>
            </div>
            <Sidebar className="w-full border-none p-0 shadow-none" onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:gap-6 lg:px-8 lg:py-8">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
