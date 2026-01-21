"use client";

import { useEffect, useState } from "react";

import { defaultLocale, locales, type Locale } from "./config";

const storageKey = "fv_locale_v1";

export const readStoredLocale = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return null;
  }
  return locales.includes(saved as Locale) ? (saved as Locale) : null;
};

export const setStoredLocale = (locale: Locale) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey, locale);
  document.cookie = `fv_locale=${locale}; path=/; max-age=31536000`;
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent("fv-locale-updated", { detail: locale }));
};

export const useLocale = () => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const current = readStoredLocale() ?? defaultLocale;
    setLocale(current);
    document.documentElement.lang = current;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const next = readStoredLocale() ?? defaultLocale;
        setLocale(next);
        document.documentElement.lang = next;
      }
    };

    const handleCustom = (event: Event) => {
      const custom = event as CustomEvent<Locale>;
      if (custom.detail) {
        setLocale(custom.detail);
        document.documentElement.lang = custom.detail;
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("fv-locale-updated", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("fv-locale-updated", handleCustom);
    };
  }, []);

  const updateLocale = (next: Locale) => {
    setStoredLocale(next);
    setLocale(next);
  };

  return { locale, updateLocale };
};
