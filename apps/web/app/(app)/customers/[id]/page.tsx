import { notFound } from "next/navigation";

import { Section } from "@/components/ui/Section";
import { getCustomerById } from "@/features/customers/service";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
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
        <div className="flex items-center gap-4">
          {customer.avatar_signed_url ? (
            <img
              src={customer.avatar_signed_url}
              alt={customer.name}
              className="h-12 w-12 rounded-full border border-slate-200/70 object-cover shadow-sm"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {customer.name}
            </h1>
            <p className="text-sm text-slate-500">{t("detail.subtitle")}</p>
          </div>
        </div>
        <Link href={`/customers/${customer.id}/edit`}>
          <Button>{t("detail.edit")}</Button>
        </Link>
      </header>

      <Section title={t("detail.summary.title")} description={t("detail.summary.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.contact")}
            </p>
            <p className="mt-2 text-sm text-slate-700">{customer.email ?? "-"}</p>
            <p className="text-sm text-slate-700">{customer.phone ?? "-"}</p>
            <p className="mt-2 text-sm text-slate-700">
              {customer.company_name ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.address")}
            </p>
            {customer.addresses?.length ? (
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                {customer.addresses.map((address) => (
                  <div key={address.id}>
                    <p className="font-semibold text-slate-900">
                      {address.label || t("detail.summary.address")}
                    </p>
                    <p>
                      {address.address_line1}
                      {address.address_line2 ? `, ${address.address_line2}` : ""}
                    </p>
                    <p>
                      {address.city}, {address.state} {address.zip_code}
                    </p>
                    <p>{address.country}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">-</p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t("detail.history.title")} description={t("detail.history.subtitle")}>
        <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-6 text-sm text-slate-500">
          {t("detail.history.empty")}
        </div>
      </Section>
    </div>
  );
}
