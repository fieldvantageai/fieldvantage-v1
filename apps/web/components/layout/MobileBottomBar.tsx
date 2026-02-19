"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, UserCircle, Users } from "lucide-react";

import { useClientT } from "@/lib/i18n/useClientT";
import { getNavItems, normalizeUserRole } from "@/lib/navigation/getNavItems";

type MobileBottomBarProps = {
  userRole?: string | null;
};

const ICON_BY_HREF: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-6 w-6" />,
  "/jobs": <Briefcase className="h-6 w-6" />,
  "/customers": <Users className="h-6 w-6" />,
  "/employees": <UserCircle className="h-6 w-6" />
};

export default function MobileBottomBar({ userRole }: MobileBottomBarProps) {
  const pathname = usePathname();
  const { t } = useClientT("common");
  const navItems = getNavItems({ role: normalizeUserRole(userRole), t }) ?? [];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-stretch">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const icon = ICON_BY_HREF[item.href];

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-0.5 transition-colors duration-200 active:scale-95 ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors duration-200 ${
                    isActive ? "bg-blue-50" : ""
                  }`}
                >
                  {icon}
                </span>
                <span className="w-full text-center text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* iOS safe area */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </nav>
  );
}
