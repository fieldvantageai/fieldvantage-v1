"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, UserRound, PanelLeftClose, PanelLeftOpen } from "lucide-react";

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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function Sidebar({
  className,
  onNavigate,
  showHeader = true,
  userName,
  userRole,
  userAvatarUrl,
  userEmployeeId,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useClientT("common");
  const navItems = getNavItems({
    role: normalizeUserRole(userRole),
    t
  });
  const iconByHref: Record<string, JSX.Element> = {
    "/dashboard": <LayoutDashboard className="h-4 w-4" />,
    "/jobs": <ClipboardList className="h-4 w-4" />,
    "/customers": <Users className="h-4 w-4" />,
    "/employees": <UserRound className="h-4 w-4" />
  };

  const profileHref = userEmployeeId
    ? `/employees/${userEmployeeId}/edit`
    : "/employees";

  return (
    <aside
      className={`shrink-0 rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-sm transition-all duration-200 ${
        collapsed ? "w-20" : "w-72"
      } ${className ?? ""}`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-4`}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label={collapsed ? t("actions.expand") : t("actions.collapse")}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {showHeader && !collapsed ? (
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
            const icon = iconByHref[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`relative flex min-h-12 items-center rounded-2xl px-3 py-3 text-sm font-medium transition active:scale-[0.98] active:opacity-90 ${
                  isActive
                    ? "bg-brand-50/80 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-700"
                }`}
              >
                {isActive ? (
                  <span className="absolute left-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-brand-500/80" />
                ) : null}
                <div className={`flex w-full items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  <span className="text-slate-500">{icon}</span>
                  {!collapsed ? <span>{item.label}</span> : null}
                </div>
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
