import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import StatusBadge from "@/components/orders/StatusBadge";
import { getEmployeeById, listEmployeeJobs } from "@/features/employees/service";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "employees");
  const tCommon = await getT(locale, "common");
  const employee = await getEmployeeById(id);
  const jobs = await listEmployeeJobs(id);

  if (!employee) {
    notFound();
  }

  const avatarLabel = employee.full_name?.trim() || "Colaborador";
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
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200/70 bg-slate-100 text-lg font-semibold text-slate-500">
            {employee.avatar_signed_url ? (
              <img
                src={employee.avatar_signed_url}
                alt={avatarLabel}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarInitial
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {employee.full_name}
            </h1>
            <p className="text-sm text-slate-500">
              {getEmployeeRoleLabel(employee.role)}
            </p>
          </div>
        </div>
        <Link href={`/employees/${employee.id}/edit`}>
          <Button>{t("detail.edit")}</Button>
        </Link>
      </header>

      <Section title={t("detail.summary.title")} description={t("detail.summary.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.contact")}
            </p>
            <p className="mt-2 text-sm text-slate-700">{employee.email}</p>
            <p className="text-sm text-slate-700">
              {employee.phone ?? t("detail.summary.phoneFallback")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {tCommon("labels.status")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {employee.status === "active"
                ? tCommon("status.active")
                : tCommon("status.inactive")}
            </p>
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
