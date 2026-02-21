"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
  Users
} from "lucide-react";

import { useClientT } from "@/lib/i18n/useClientT";
import { getNavItems, normalizeUserRole } from "@/lib/navigation/getNavItems";
import { ThemedLogo } from "@/components/ui/ThemedLogo";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  userRole?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const ICON_BY_HREF: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-5 w-5" />,
  "/jobs": <Briefcase className="h-5 w-5" />,
  "/customers": <Users className="h-5 w-5" />,
  "/employees": <UserCircle className="h-5 w-5" />
};

export default function Sidebar({
  className,
  onNavigate,
  userRole,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useClientT("common");
  const navItems = getNavItems({ role: normalizeUserRole(userRole), t });

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-slate-200/70 bg-[var(--sidebar-bg)] dark:border-[var(--border)] dark:bg-[var(--sidebar-bg)] ${
        collapsed ? "w-[72px]" : "w-60"
      } ${className ?? ""}`}
    >
      {/* Logo + Toggle */}
      <div
        className={`flex h-16 items-center border-b border-slate-200/70 px-4 dark:border-[var(--border)] ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed ? (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5"
            aria-label={t("nav.dashboard")}
          >
            <ThemedLogo iconOnly className="h-8 w-8 shrink-0 rounded-xl object-contain" />
            <span className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-[var(--text)]">
              Geklix
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            aria-label={t("nav.dashboard")}
          >
            <ThemedLogo iconOnly className="h-8 w-8 rounded-xl object-contain" />
          </Link>
        )}

        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface)] dark:hover:text-[var(--text)]"
            aria-label={collapsed ? t("actions.expand") : t("actions.collapse")}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!navItems ? (
          <div className="space-y-1.5 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-[var(--surface)]" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const icon = ICON_BY_HREF[item.href];

              return (
                <li key={item.href}>
                  {collapsed ? (
                    /* Collapsed: centered pill icon only */
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      className="group relative flex h-11 w-full items-center justify-center"
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                          isActive
                            ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                            : "text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:text-[var(--text-muted)] dark:hover:bg-[var(--primary-subtle)] dark:hover:text-brand-400"
                        }`}
                      >
                        {icon}
                      </span>
                      {/* Tooltip */}
                      <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    /* Expanded: full row */
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20 dark:shadow-[0_0_14px_rgba(22,199,132,0.22)]"
                          : "text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-[var(--text-muted)] dark:hover:bg-[var(--primary-subtle)] dark:hover:text-brand-400"
                      }`}
                    >
                      <span
                        className={`shrink-0 transition-colors duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-brand-600 dark:text-[var(--text-muted)] dark:group-hover:text-brand-400"
                        }`}
                      >
                        {icon}
                      </span>
                      <span
                        className={`truncate font-medium ${
                          isActive ? "text-white" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
