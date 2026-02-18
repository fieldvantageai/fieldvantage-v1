import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { getMyCompany } from "@/features/companies/service";
import { getDashboardSnapshot } from "@/features/dashboard/service";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "dashboard");
  const context = await getActiveCompanyContext();
  const isMember = context?.role === "member";
  const company = await getMyCompany();

  if (!company) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </header>
        <Section
          title={t("companySetup.title")}
          description={t("companySetup.subtitle")}
        >
          <Link href="/settings/company">
            <Button>{t("companySetup.action")}</Button>
          </Link>
        </Section>
      </div>
    );
  }

  const snapshot = await getDashboardSnapshot();

  return (
    <DashboardClient
      initialSnapshot={snapshot}
      locale={locale}
      isMember={isMember}
    />
  );
}
