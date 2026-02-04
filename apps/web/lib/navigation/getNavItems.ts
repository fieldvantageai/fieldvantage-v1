export type UserRole = "owner" | "admin" | "member" | "collaborator" | "employee";

type NavItem = { label: string; href: string };

type GetNavItemsInput = {
  role: UserRole | null;
  t: (key: string) => string;
};

export const normalizeUserRole = (role?: string | null): UserRole | null => {
  if (!role) {
    return null;
  }
  if (role === "owner" || role === "admin") {
    return role;
  }
  if (role === "member" || role === "collaborator" || role === "employee") {
    return "member";
  }
  return null;
};

export const getNavItems = ({ role, t }: GetNavItemsInput): NavItem[] | null => {
  if (!role) {
    return null;
  }
  const base: NavItem[] = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.jobs"), href: "/jobs" }
  ];

  const ownerOnly: NavItem[] = [
    { label: t("nav.customers"), href: "/customers" },
    { label: t("nav.employees"), href: "/employees" }
  ];

  if (role === "owner" || role === "admin") {
    return [...base, ...ownerOnly];
  }

  return base;
};
