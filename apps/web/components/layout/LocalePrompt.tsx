"use client";

import { useEffect, useState } from "react";

import { locales, type Locale } from "@/lib/i18n/config";
import { readStoredLocale, setStoredLocale } from "@/lib/i18n/localeClient";
import { useClientT } from "@/lib/i18n/useClientT";

const localeFlags: Record<Locale, string> = {
  "pt-BR": "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸"
};

export default function LocalePrompt() {
  const { t } = useClientT("settings");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Locale>("pt-BR");

  useEffect(() => {
    const saved = readStoredLocale();
    if (!saved) {
      setIsOpen(true);
    } else {
      setSelected(saved);
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">
          {t("localePrompt.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("localePrompt.subtitle")}
        </p>
        <div className="mt-4 space-y-2">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setSelected(locale)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                selected === locale
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200/70 bg-white/90 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{localeFlags[locale]}</span>
                <span>{t(`locales.${locale}`)}</span>
              </span>
              {selected === locale ? (
                <span className="text-xs font-semibold">
                  {t("localePrompt.selected")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          onClick={() => {
            setStoredLocale(selected);
            setIsOpen(false);
          }}
        >
          {t("localePrompt.confirm")}
        </button>
      </div>
    </div>
  );
}
