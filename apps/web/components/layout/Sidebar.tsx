"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useClientT } from "@/lib/i18n/useClientT";
import { getNavItems, normalizeUserRole } from "@/lib/navigation/getNavItems";
import SidebarUserHeader from "@/components/layout/SidebarUserHeader";

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
  const navItems = getNavItems({
    role: normalizeUserRole(userRole),
    t
  });
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
          className="mb-6 block"
          aria-label={t("nav.employees")}
        >
          <SidebarUserHeader
            userName={userName}
            userRole={userRole}
            userAvatarUrl={userAvatarUrl}
            variant="desktop"
          />
        </Link>
      ) : null}
      <nav className="space-y-2">
        {!navItems ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-11 rounded-2xl bg-slate-100" />
            <div className="h-11 rounded-2xl bg-slate-100" />
          </div>
        ) : (
          navItems.map((item) => {
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
          })
        )}
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
