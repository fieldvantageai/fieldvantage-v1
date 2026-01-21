export const locales = ["en", "pt-BR", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

export const namespaces = [
  "common",
  "auth",
  "dashboard",
  "customers",
  "jobs",
  "employees",
  "teams",
  "settings",
  "companies"
] as const;
export type Namespace = (typeof namespaces)[number];
