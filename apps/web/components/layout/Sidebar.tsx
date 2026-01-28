"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useClientT } from "@/lib/i18n/useClientT";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  showHeader?: boolean;
  userName?: string | null;
  userRole?: string | null;
  userAvatarUrl?: string | null;
  userEmployeeId?: string | null;
};

export default function Sidebar({
  className,
  onNavigate,
  showHeader = true,
  userName,
  userRole,
  userAvatarUrl,
  userEmployeeId
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useClientT("common");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const firstName =
    userName?.trim().split(" ").filter(Boolean)[0] ?? t("status.loading");
  const roleLabelMap: Record<string, string> = {
    owner: t("roles.owner"),
    admin: t("roles.admin"),
    employee: t("roles.employee")
  };
  const roleLabel =
    (userRole && roleLabelMap[userRole]) || userRole || t("roles.owner");

  const navItems = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.jobs"), href: "/jobs" },
    { label: t("nav.customers"), href: "/customers" },
    { label: t("nav.employees"), href: "/employees" }
  ];
  const settingsItem = { label: t("nav.settings"), href: "/settings" };

  const profileHref = userEmployeeId
    ? `/employees/${userEmployeeId}/edit`
    : "/employees";

  return (
    <aside
      className={`w-72 shrink-0 rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm ${className ?? ""}`}
    >
      {showHeader ? (
        <Link
          href={profileHref}
          onClick={onNavigate}
          className="mb-6 flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50/70"
          aria-label={t("nav.employees")}
        >
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-slate-200/70 bg-slate-100 text-xs font-semibold text-slate-500">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={firstName}
                className="h-full w-full object-cover"
              />
            ) : (
              firstName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900">{firstName}</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
        </Link>
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
        <button
          type="button"
          onClick={async () => {
            if (isLoggingOut) {
              return;
            }
            setIsLoggingOut(true);
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } finally {
              setIsLoggingOut(false);
              onNavigate?.();
              router.push("/entrar");
              router.refresh();
            }
          }}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition active:scale-[0.98] active:opacity-90 hover:bg-slate-50/60 hover:text-slate-700"
          aria-label={t("actions.logout")}
        >
          <span className="pl-2">{t("actions.logout")}</span>
        </button>
      </nav>
    </aside>
  );
}
