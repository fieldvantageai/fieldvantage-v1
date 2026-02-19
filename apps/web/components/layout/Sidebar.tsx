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
      className={`flex shrink-0 flex-col bg-white/95 overflow-hidden ${
        collapsed ? "w-[72px]" : "w-60"
      } ${className ?? ""}`}
    >
      {/* Logo + Toggle */}
      <div
        className={`flex h-16 items-center border-b border-slate-200/70 px-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed ? (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 min-w-0"
            aria-label={t("nav.dashboard")}
          >
            <img
              src="/brand/logo.png"
              alt={t("appName")}
              className="h-8 w-8 shrink-0 rounded-xl object-contain"
            />
            <span className="truncate text-[15px] font-bold tracking-tight text-slate-900">
              {t("appName")}
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            aria-label={t("nav.dashboard")}
          >
            <img
              src="/brand/logo.png"
              alt={t("appName")}
              className="h-8 w-8 rounded-xl object-contain"
            />
          </Link>
        )}

        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 ${
              collapsed ? "mt-0" : ""
            }`}
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
              <div key={i} className="h-11 rounded-xl bg-slate-100" />
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
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex h-11 items-center rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      collapsed ? "justify-center px-0" : "gap-3 px-3"
                    } ${
                      isActive
                        ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-200"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-500 transition-colors duration-200"
                      }`}
                    >
                      {icon}
                    </span>

                    {!collapsed ? (
                      <span
                        className={`truncate font-medium ${
                          isActive ? "text-white" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                    ) : null}

                    {/* Tooltip when collapsed */}
                    {collapsed ? (
                      <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
