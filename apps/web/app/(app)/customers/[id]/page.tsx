import { notFound } from "next/navigation";

import { Section } from "@/components/ui/Section";
import { getCustomerById, listCustomerJobs } from "@/features/customers/service";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import StatusBadge from "@/components/orders/StatusBadge";
import AddressNotesModal from "@/components/customers/AddressNotesModal";
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
  const jobs = await listCustomerJobs(id);

  if (!customer) {
    notFound();
  }

  const avatarLabel = customer.name?.trim() || "Cliente";
  const avatarInitial = avatarLabel.charAt(0).toUpperCase();
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200/70 bg-slate-100 text-base font-semibold text-slate-500 shadow-sm">
            {customer.avatar_signed_url ? (
              <img
                src={customer.avatar_signed_url}
                alt={avatarLabel}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarInitial
            )}
          </div>
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
              <div className="mt-2 space-y-3 text-sm text-slate-700">
                {customer.addresses.map((address, index) => {
                  const isPrimary =
                    address.is_primary || (!customer.addresses.some((item) => item.is_primary) && index === 0);
                  const notes = address.note ?? "";
                  return (
                    <div
                      key={address.id}
                      className={`rounded-2xl border px-4 py-3 ${
                        isPrimary
                          ? "border-brand-200/70 bg-brand-50/50"
                          : "border-slate-200/70 bg-white/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-brand-600">📍</span>
                            <p className="font-semibold text-slate-900">
                              {address.label || t("detail.address.fallbackLabel")}
                            </p>
                            {isPrimary ? (
                              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                {t("detail.address.primary")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {notes ? (
                          <AddressNotesModal
                            notes={notes}
                            label={t("detail.address.notes")}
                          />
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        <p>
                          {address.address_line1}
                          {address.address_line2 ? `, ${address.address_line2}` : ""}
                        </p>
                        <p>
                          {address.city}, {address.state} {address.zip_code}
                        </p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">-</p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t("detail.jobs.title")} description={t("detail.jobs.subtitle")}>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-6 text-sm text-slate-500">
            {t("detail.jobs.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {job.title ?? job.customer_name ?? t("detail.jobs.titleFallback")}
                  </p>
                  {job.title && job.customer_name ? (
                    <p className="text-xs text-slate-500">{job.customer_name}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    {dateTimeFormatter.format(new Date(job.scheduled_for))}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
