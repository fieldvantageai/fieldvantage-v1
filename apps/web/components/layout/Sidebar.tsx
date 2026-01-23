"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClientT } from "@/lib/i18n/useClientT";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  showHeader?: boolean;
};

export default function Sidebar({ className, onNavigate, showHeader = true }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useClientT("common");

  const navItems = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.jobs"), href: "/jobs" },
    { label: t("nav.customers"), href: "/customers" },
    { label: t("nav.employees"), href: "/employees" }
  ];
  const settingsItem = { label: t("nav.settings"), href: "/settings" };

  return (
    <aside
      className={`w-64 shrink-0 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm ${className ?? ""}`}
    >
      {showHeader ? (
        <>
          <div className="mb-6 space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              FieldVantage
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {t("workspace")}
            </p>
          </div>
          <div className="mb-4 h-px bg-slate-200/70" />
        </>
      ) : null}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition active:scale-[0.98] active:opacity-90 ${
                isActive
                  ? "bg-brand-50/80 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-700"
              }`}
            >
              {isActive ? (
                <span className="absolute left-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-brand-500/80" />
              ) : null}
              <span className="pl-2">{item.label}</span>
            </Link>
          );
        })}
        <div className="my-2 h-px bg-slate-200/70" />
        <Link
          href={settingsItem.href}
          onClick={onNavigate}
          className={`relative flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition active:scale-[0.98] active:opacity-90 ${
            pathname === settingsItem.href
              ? "bg-brand-50/80 text-brand-700"
              : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-700"
          }`}
        >
          {pathname === settingsItem.href ? (
            <span className="absolute left-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-brand-500/80" />
          ) : null}
          <span className="pl-2">{settingsItem.label}</span>
        </Link>
      </nav>
    </aside>
  );
}
