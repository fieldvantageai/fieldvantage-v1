import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getJobById } from "@/features/jobs/service";
import { listEmployees } from "@/features/employees/service";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const tCommon = await getT(locale, "common");
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }
  const employees = await listEmployees();
  const assignedEmployees = (job.assigned_employee_ids ?? []).map((employeeId) =>
    employees.find((employee) => employee.id === employeeId)
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-500">
            {job.customer_name ?? t("detail.customerFallback")}
          </p>
        </div>
        <Link href={`/jobs/${job.id}/edit`}>
          <Button>{t("detail.edit")}</Button>
        </Link>
      </header>

      <Section title={t("detail.summary.title")} description={t("detail.summary.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {tCommon("labels.status")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {t(`status.${job.status}`)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.scheduled")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {new Date(job.scheduled_for).toLocaleString(locale)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.expectedCompletion")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {job.expected_completion
                ? new Date(job.expected_completion).toLocaleDateString(locale)
                : t("detail.summary.notDefined")}
            </p>
          </div>
        </div>
      </Section>

      <Section
        title={t("detail.team.title")}
        description={t("detail.team.subtitle")}
      >
        {assignedEmployees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            {t("detail.team.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {assignedEmployees.map((employee, index) => (
              <div
                key={employee?.id ?? `missing-${index}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {employee?.full_name ?? t("detail.team.unknown")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {employee?.email ?? t("detail.team.unknownEmail")}
                  </p>
                </div>
                {employee?.status ? (
                  <span className="text-xs font-semibold text-slate-500">
                    {employee.status === "active"
                      ? tCommon("status.active")
                      : tCommon("status.inactive")}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("detail.history.title")} description={t("detail.history.subtitle")}>
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          {t("detail.history.empty")}
        </div>
      </Section>
    </div>
  );
}
