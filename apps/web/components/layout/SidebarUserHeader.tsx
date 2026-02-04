import { useMemo } from "react";

import { useClientT } from "@/lib/i18n/useClientT";

type SidebarUserHeaderProps = {
  userName?: string | null;
  userRole?: string | null;
  userAvatarUrl?: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  variant?: "desktop" | "mobile";
};

const getFirstName = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }
  const [first] = trimmed.split(" ").filter(Boolean);
  return first ?? trimmed;
};

const getNameFallback = (raw: string | null | undefined) => {
  if (!raw) {
    return null;
  }
  if (raw.includes("@")) {
    return raw.split("@")[0] ?? raw;
  }
  return raw;
};

export default function SidebarUserHeader({
  userName,
  userRole,
  userAvatarUrl,
  companyName,
  companyLogoUrl,
  variant = "desktop"
}: SidebarUserHeaderProps) {
  const { t } = useClientT("common");

  const resolvedName = useMemo(() => {
    const fallback = getNameFallback(userName);
    if (!fallback) {
      return null;
    }
    return getFirstName(fallback) || fallback;
  }, [userName]);

  const roleLabelMap: Record<string, string> = {
    owner: t("roles.owner"),
    admin: t("roles.admin"),
    employee: t("roles.employee"),
    member: t("roles.employee"),
    collaborator: t("roles.employee")
  };

  const roleLabel =
    (userRole && roleLabelMap[userRole]) || (userRole ? userRole : "—");

  const containerClasses =
    variant === "mobile"
      ? "flex items-center gap-3"
      : "flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50/70";

  const avatarSize = variant === "mobile" ? "h-10 w-10" : "h-7 w-7";
  const nameClass = variant === "mobile" ? "text-sm" : "text-lg";

  return (
    <div className={containerClasses}>
      <span
        className={`flex ${avatarSize} items-center justify-center overflow-hidden rounded-full border border-slate-200/70 bg-slate-100 text-xs font-semibold text-slate-500`}
      >
        {userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt={resolvedName ?? t("status.loading")}
            className="h-full w-full object-cover"
          />
        ) : (
          (resolvedName ?? t("status.loading")).charAt(0).toUpperCase()
        )}
      </span>
      <div className="min-w-0">
        <p className={`font-semibold text-slate-900 ${nameClass}`}>
          {resolvedName ?? t("status.loading")}
        </p>
        <p className="text-xs text-slate-500">{roleLabel}</p>
        {companyName ? (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt={companyName}
                className="h-4 w-4 rounded-full border border-slate-200/70 object-cover"
              />
            ) : null}
            <span className="truncate">{companyName}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
