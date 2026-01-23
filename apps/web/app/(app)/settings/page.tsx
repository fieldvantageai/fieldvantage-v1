import SettingsPanel from "@/components/settings/SettingsPanel";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "settings");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </header>
      <SettingsPanel />
    </div>
  );
}
