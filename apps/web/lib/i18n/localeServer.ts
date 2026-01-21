import { cookies } from "next/headers";

import { defaultLocale, locales, type Locale } from "./config";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get("fv_locale")?.value;
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  return defaultLocale;
}
