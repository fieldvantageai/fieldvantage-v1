"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClientT } from "@/lib/i18n/useClientT";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useClientT("common");

  const navItems = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.jobs"), href: "/jobs" },
    { label: t("nav.customers"), href: "/customers" },
    { label: t("nav.employees"), href: "/employees" },
    { label: t("nav.settings"), href: "/settings" }
  ];

  return (
    <aside className="w-60 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          FieldVantage
        </p>
        <p className="text-lg font-semibold text-slate-900">
          {t("workspace")}
        </p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
