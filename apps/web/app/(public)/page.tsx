import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function LandingPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "common");

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">
          {t("appName")}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
          {t("landing.title")}
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          {t("landing.subtitle")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register/company">
            <Button>{t("actions.register")}</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">{t("actions.login")}</Button>
          </Link>
        </div>
      </div>
      <Section
        title={t("landing.features.title")}
        description={t("landing.features.subtitle")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: t("landing.features.cards.0.title"),
              text: t("landing.features.cards.0.text")
            },
            {
              title: t("landing.features.cards.1.title"),
              text: t("landing.features.cards.1.text")
            },
            {
              title: t("landing.features.cards.2.title"),
              text: t("landing.features.cards.2.text")
            }
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{card.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
