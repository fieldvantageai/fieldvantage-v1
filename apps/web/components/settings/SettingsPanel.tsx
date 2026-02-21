"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { defaultEmployeeRoles } from "@/features/employees/roles";
import { locales, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/localeClient";
import { useClientT } from "@/lib/i18n/useClientT";

type NavigationPreference = "auto" | "google_maps" | "apple_maps" | "waze";
type EmployeeRole = "owner" | "admin" | "employee";

const FlagIcon = ({ locale }: { locale: Locale }) => {
  if (locale === "pt-BR") {
    return (
      <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
        <rect width="20" height="14" rx="2" fill="#1E8E3E" />
        <path d="M10 1.6L18 7L10 12.4L2 7L10 1.6Z" fill="#F4C430" />
        <circle cx="10" cy="7" r="2.6" fill="#2A5CAA" />
      </svg>
    );
  }
  if (locale === "en") {
    return (
      <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
        <rect width="20" height="14" rx="2" fill="#FFFFFF" />
        <rect y="1" width="20" height="2" fill="#B91C1C" />
        <rect y="5" width="20" height="2" fill="#B91C1C" />
        <rect y="9" width="20" height="2" fill="#B91C1C" />
        <rect y="13" width="20" height="1" fill="#B91C1C" />
        <rect width="8.5" height="7.5" fill="#1E3A8A" />
      </svg>
    );
  }
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#C81E1E" />
      <rect y="3.5" width="20" height="7" fill="#F6C400" />
    </svg>
  );
};

export default function SettingsPanel() {
  const { t } = useClientT("settings");
  const { t: tCommon } = useClientT("common");
  const [activeTab, setActiveTab] = useState<"app" | "company">("app");
  const { locale, updateLocale } = useLocale();
  const [pendingLocale, setPendingLocale] = useState<Locale>(locale);
  const [navigationPreference, setNavigationPreference] =
    useState<NavigationPreference>("auto");
  const [pendingNavigationPreference, setPendingNavigationPreference] =
    useState<NavigationPreference>("auto");
  const [isLoadingNavigation, setIsLoadingNavigation] = useState(true);
  const [userRole, setUserRole] = useState<EmployeeRole | null>(null);

  useEffect(() => {
    setPendingLocale(locale);
  }, [locale]);

  useEffect(() => {
    let isMounted = true;

    const loadPreference = async () => {
      try {
        const response = await fetch("/api/user/preferences", {
          cache: "no-store"
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          data?: { preferred_navigation_app?: NavigationPreference | null };
        };
        const preference = payload.data?.preferred_navigation_app ?? "auto";
        if (isMounted) {
          setNavigationPreference(preference);
          setPendingNavigationPreference(preference);
        }
      } catch {
        if (isMounted) {
          setNavigationPreference("auto");
          setPendingNavigationPreference("auto");
        }
      } finally {
        if (isMounted) {
          setIsLoadingNavigation(false);
        }
      }
    };

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadRole = async () => {
      try {
        const response = await fetch("/api/employees/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          data?: { role?: EmployeeRole | null };
        };
        if (isMounted) {
          setUserRole(payload.data?.role ?? null);
          if (payload.data?.role === "employee") {
            setActiveTab("app");
          }
        }
      } catch {
        if (isMounted) {
          setUserRole(null);
        }
      }
    };

    loadRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const localeOptions = useMemo(
    () =>
      locales.map((option) => ({
        value: option,
        label: t(`locales.${option}`)
      })),
    [t]
  );

  const isIOS = useMemo(
    () =>
      typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent),
    []
  );

  const navigationOptions = useMemo(() => {
    const base = [
      { value: "auto", label: t("navigation.options.auto") },
      { value: "google_maps", label: t("navigation.options.google") },
      { value: "waze", label: t("navigation.options.waze") }
    ] as Array<{ value: NavigationPreference; label: string }>;
    if (isIOS) {
      base.splice(2, 0, {
        value: "apple_maps",
        label: t("navigation.options.apple")
      });
    }
    return base;
  }, [t, isIOS]);

  const handleApply = async () => {
    if (pendingLocale !== locale) {
      updateLocale(pendingLocale);
    }
    if (
      !isLoadingNavigation &&
      pendingNavigationPreference !== navigationPreference
    ) {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_navigation_app: pendingNavigationPreference
        })
      });
      if (response.ok) {
        setNavigationPreference(pendingNavigationPreference);
      }
    }
  };

  const hasLocaleChanges = pendingLocale !== locale;
  const hasNavigationChanges =
    pendingNavigationPreference !== navigationPreference && !isLoadingNavigation;
  const hasChanges = hasLocaleChanges || hasNavigationChanges;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeTab === "app" ? "primary" : "secondary"}
          onClick={() => setActiveTab("app")}
        >
          {t("tabs.app")}
        </Button>
        {userRole && userRole !== "employee" ? (
          <Button
            type="button"
            variant={activeTab === "company" ? "primary" : "secondary"}
            onClick={() => setActiveTab("company")}
          >
            {t("tabs.company")}
          </Button>
        ) : null}
      </div>

      {activeTab === "app" ? (
        <div className="space-y-6">
          <Section title="Tema" description="Personaliza a aparência visual do app.">
            <ThemeSection />
          </Section>

          <Section
            title={t("locale.title")}
            description={t("locale.subtitle")}
          >
            <div className="max-w-sm space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("locale.label")}
              </label>
              <div className="space-y-2">
                {localeOptions.map((option) => {
                  const isSelected = pendingLocale === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPendingLocale(option.value)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-sm transition ${
                        isSelected
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-slate-200/70 bg-white/90 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="flex items-center gap-2">
                        <FlagIcon locale={option.value} />
                        {option.label}
                      </span>
                      {isSelected ? (
                        <span className="text-xs font-semibold">✓</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">{t("locale.helper")}</p>
            </div>
          </Section>

          <Section
            title={t("navigation.title")}
            description={t("navigation.subtitle")}
          >
            <div className="max-w-sm space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("navigation.label")}
              </label>
              <div className="space-y-2">
                {navigationOptions.map((option) => {
                  const isSelected = pendingNavigationPreference === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPendingNavigationPreference(option.value)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-sm transition ${
                        isSelected
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-slate-200/70 bg-white/90 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                      }`}
                      aria-pressed={isSelected}
                      disabled={isLoadingNavigation}
                    >
                      <span>{option.label}</span>
                      {isSelected ? (
                        <span className="text-xs font-semibold">✓</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">{t("navigation.helper")}</p>
            </div>
          </Section>

          <Section
            title={t("companySwitch.title")}
            description={t("companySwitch.subtitle")}
          >
            <div className="flex justify-start">
              <Link href="/select-company">
                <Button type="button" variant="secondary">
                  {t("companySwitch.action")}
                </Button>
              </Link>
            </div>
          </Section>
        </div>
      ) : userRole && userRole !== "employee" ? (
        <Section
          title={t("companyProfile.title")}
          description={t("companyProfile.subtitle")}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("companyProfile.title")}
              </p>
              <div className="mt-2 space-y-2">
                <Link
                  href="/settings/company"
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <span>{t("companyProfile.action")}</span>
                  <span className="text-xs font-semibold text-slate-400">→</span>
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("roles.title")}
              </p>
              <div className="mt-2 space-y-2">
                {defaultEmployeeRoles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700"
                  >
                    {role.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" disabled={!hasChanges} onClick={handleApply}>
          {tCommon("actions.apply")}
        </Button>
      </div>
    </div>
  );
}
