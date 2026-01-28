import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getCustomerById } from "@/features/customers/service";
import { listEmployees } from "@/features/employees/service";
import { getJobById, listJobEvents } from "@/features/jobs/service";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

type PageProps = {
  params: Promise<{ id: string }>;
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
  const customer = job.customer_id ? await getCustomerById(job.customer_id) : null;
  const primaryAddress =
    customer?.addresses.find((address) => address.is_primary) ??
    customer?.addresses[0];
  const jobEvents = await listJobEvents(job.id);

  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const dateOnlyFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const formatDateTime = (value: string) =>
    dateTimeFormatter.format(new Date(value));
  const formatDateOnly = (value: string) =>
    dateOnlyFormatter.format(new Date(value));
  const formatTemplate = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
  const expectedHasTime = job.estimated_end_at?.includes("T");
  const statusVariant =
    job.status === "done"
      ? "success"
      : job.status === "in_progress"
        ? "warning"
        : job.status === "canceled"
          ? "danger"
          : "default";

  const createdFallback = {
    id: "created-fallback",
    event_type: "created",
    occurred_at: job.created_at
  };
  const createdExists = jobEvents.some((event) => event.event_type === "created");
  const historyEvents = (createdExists
    ? jobEvents
    : [createdFallback, ...jobEvents]
  ).sort(
    (left, right) =>
      new Date(right.occurred_at).getTime() -
      new Date(left.occurred_at).getTime()
  );

  const historyLabel = (event: { event_type?: string; to_status?: string | null }) => {
    if (event.event_type === "created") {
      return t("detail.history.createdLabel");
    }
    if (event.event_type === "status_changed") {
      const statusLabel = event.to_status
        ? t(`status.${event.to_status}`)
        : t("detail.history.statusFallback");
      return `${t("detail.history.statusChangedLabel")} ${statusLabel}`;
    }
    return t("detail.history.eventFallback");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {job.title ?? t("table.titleFallback")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("detail.customerLabel")}{" "}
            {job.customer_id ? (
              <Link
                href={`/customers/${job.customer_id}`}
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {job.customer_name ?? t("detail.customerFallback")}
              </Link>
            ) : (
              <span className="font-semibold text-slate-700">
                {job.customer_name ?? t("detail.customerFallback")}
              </span>
            )}
          </p>
        </div>
        <Link href={`/jobs/${job.id}/edit`}>
          <Button>{t("detail.edit")}</Button>
        </Link>
      </header>

      <Section title={t("detail.summary.title")} description={t("detail.summary.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {tCommon("labels.status")}
            </p>
            <div className="mt-2">
              <Badge variant={statusVariant}>{t(`status.${job.status}`)}</Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.scheduled")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {formatDateTime(job.scheduled_for)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {expectedHasTime
                ? t("detail.summary.expectedCompletion")
                : t("detail.summary.expectedCompletionDateOnly")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {job.estimated_end_at
                ? expectedHasTime
                  ? formatDateTime(job.estimated_end_at)
                  : formatDateOnly(job.estimated_end_at)
                : t("detail.summary.notDefined")}
            </p>
          </div>
        </div>
      </Section>

      {job.is_recurring ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {t("detail.recurrence.label")}
          </span>{" "}
          {formatTemplate(t("detail.recurrence.summary"), {
            repeat: t(`recurrence.repeat.${job.recurrence?.repeat ?? "daily"}`),
            every: job.recurrence?.every ?? 1
          })}
        </div>
      ) : null}

      <Section title={t("detail.customer.title")} description={t("detail.customer.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.customer.fields.name")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {job.customer_name ?? t("detail.customerFallback")}
            </p>
            <p className="text-sm text-slate-700">
              {customer?.email ?? t("detail.customer.fields.emailFallback")}
            </p>
            <p className="text-sm text-slate-700">
              {customer?.phone ?? t("detail.customer.fields.phoneFallback")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.customer.fields.address")}
            </p>
            {primaryAddress ? (
              <div className="mt-2 text-sm text-slate-700">
                <p>{primaryAddress.address_line1}</p>
                {primaryAddress.address_line2 ? (
                  <p>{primaryAddress.address_line2}</p>
                ) : null}
                <p>
                  {primaryAddress.city}, {primaryAddress.state}{" "}
                  {primaryAddress.zip_code}
                </p>
                <p>{primaryAddress.country}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {t("detail.customer.fields.addressFallback")}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section
        title={t("detail.team.title")}
        description={t("detail.team.subtitle")}
      >
        <p className="text-xs text-slate-500">{t("detail.team.manageHint")}</p>
        {assignedEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-6 text-sm text-slate-500">
            {t("detail.team.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {assignedEmployees.map((employee, index) => (
              <div
                key={employee?.id ?? `missing-${index}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {employee?.full_name ?? t("detail.team.unknown")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {employee?.email ?? t("detail.team.unknownEmail")}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {t("detail.team.assignedLabel")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {job.notes ? (
        <Section title={t("detail.notes.title")} description={t("detail.notes.subtitle")}>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-sm text-slate-700">
            {job.notes}
          </div>
        </Section>
      ) : null}

      <Section title={t("detail.history.title")} description={t("detail.history.subtitle")}>
        <div className="space-y-3">
          {historyEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3"
            >
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {historyLabel(event)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(event.occurred_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
