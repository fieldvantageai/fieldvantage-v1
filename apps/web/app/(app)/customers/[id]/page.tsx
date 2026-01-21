import { notFound } from "next/navigation";

import { Section } from "@/components/ui/Section";
import { getCustomerById } from "@/features/customers/mock";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "customers");
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {customer.name}
          </h1>
          <p className="text-sm text-slate-500">{t("detail.subtitle")}</p>
        </div>
        <Link href={`/customers/${customer.id}/edit`}>
          <Button>{t("detail.edit")}</Button>
        </Link>
      </header>

      <Section title={t("detail.summary.title")} description={t("detail.summary.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.contact")}
            </p>
            <p className="mt-2 text-sm text-slate-700">{customer.email}</p>
            <p className="text-sm text-slate-700">{customer.phone}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.address")}
            </p>
            <p className="mt-2 text-sm text-slate-700">{customer.address}</p>
          </div>
        </div>
      </Section>

      <Section title={t("detail.history.title")} description={t("detail.history.subtitle")}>
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          {t("detail.history.empty")}
        </div>
      </Section>
    </div>
  );
}
