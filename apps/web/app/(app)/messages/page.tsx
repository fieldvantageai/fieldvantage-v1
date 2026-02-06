import { Section } from "@/components/ui/Section";
import MessagesListClient from "@/components/messages/MessagesListClient";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function MessagesPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "messages");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </header>
      <Section title={t("title")} description={t("subtitle")}>
        <MessagesListClient />
      </Section>
    </div>
  );
}
