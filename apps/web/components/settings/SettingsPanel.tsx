"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import { Select } from "@/components/ui/Select";
import {
  defaultEmployeeRoles,
  readEmployeeRoles,
  saveEmployeeRoles
} from "@/features/employees/roles";
import { locales, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/localeClient";
import { useClientT } from "@/lib/i18n/useClientT";

const localeFlags: Record<Locale, string> = {
  "pt-BR": "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸"
};

export default function SettingsPanel() {
  const { t } = useClientT("settings");
  const { t: tCommon } = useClientT("common");
  const [activeTab, setActiveTab] = useState<"app" | "company">("app");
  const [roleName, setRoleName] = useState("");
  const [initialRoles, setInitialRoles] = useState(readEmployeeRoles());
  const [roles, setRoles] = useState(readEmployeeRoles());
  const { locale, updateLocale } = useLocale();
  const [pendingLocale, setPendingLocale] = useState<Locale>(locale);

  useEffect(() => {
    setPendingLocale(locale);
  }, [locale]);

  const localeOptions = useMemo(
    () =>
      locales.map((option) => ({
        value: option,
        label: `${localeFlags[option]} ${t(`locales.${option}`)}`
      })),
    [t]
  );

  const handleAddRole = () => {
    const trimmed = roleName.trim();
    if (!trimmed) {
      return;
    }
    const alreadyExists = roles.some(
      (role) => role.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      return;
    }
    const updated = [...roles, { id: "", label: trimmed }];
    setRoles(updated);
    setRoleName("");
  };

  const handleRemoveRole = (roleId: string, roleLabel: string) => {
    const updated = roles.filter(
      (role) => role.id !== roleId || role.label !== roleLabel
    );
    setRoles(updated);
  };

  const handleApply = () => {
    const safeRoles = roles.length === 0 ? defaultEmployeeRoles : roles;
    const sanitized = saveEmployeeRoles(safeRoles);
    setRoles(sanitized);
    setInitialRoles(sanitized);

    if (pendingLocale !== locale) {
      updateLocale(pendingLocale);
    }
  };

  const hasRoleChanges =
    JSON.stringify(roles) !== JSON.stringify(initialRoles);
  const hasLocaleChanges = pendingLocale !== locale;
  const hasChanges = hasRoleChanges || hasLocaleChanges;

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
        <Button
          type="button"
          variant={activeTab === "company" ? "primary" : "secondary"}
          onClick={() => setActiveTab("company")}
        >
          {t("tabs.company")}
        </Button>
      </div>

      {activeTab === "app" ? (
        <Section
          title={t("locale.title")}
          description={t("locale.subtitle")}
        >
          <div className="max-w-sm space-y-2">
            <Select
              label={t("locale.label")}
              value={pendingLocale}
              options={localeOptions}
              onChange={(event) => setPendingLocale(event.target.value as Locale)}
            />
            <p className="text-xs text-slate-500">
              {t("locale.helper")}
            </p>
          </div>
        </Section>
      ) : (
        <Section
          title={t("roles.title")}
          description={t("roles.subtitle")}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Input
                  label={t("roles.newLabel")}
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                />
              </div>
              <Button type="button" onClick={handleAddRole}>
                {t("roles.add")}
              </Button>
            </div>

            {roles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                {t("roles.empty")}
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={`${role.id}-${role.label}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <span>{role.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveRole(role.id, role.label)}
                    >
                      {tCommon("actions.remove")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      <div className="flex justify-end">
        <Button type="button" disabled={!hasChanges} onClick={handleApply}>
          {tCommon("actions.apply")}
        </Button>
      </div>
    </div>
  );
}
