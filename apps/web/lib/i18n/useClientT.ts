"use client";

import { useMemo } from "react";

import { resources } from "./resources";
import { useLocale } from "./localeClient";
import type { Locale, Namespace } from "./config";

const resolveKey = (dictionary: Record<string, unknown>, key: string) => {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }
    return (acc as Record<string, unknown>)[part];
  }, dictionary);
};

export const useClientT = (namespace: Namespace) => {
  const { locale } = useLocale();

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      const dict = resources[locale]?.[namespace] ?? {};
      const value = resolveKey(dict as Record<string, unknown>, key);
      if (typeof value === "string") {
        return value;
      }
      return fallback ?? key;
    };
  }, [locale, namespace]);

  return { t, locale };
};
