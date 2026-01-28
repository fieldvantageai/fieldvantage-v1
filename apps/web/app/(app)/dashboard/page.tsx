import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getMyCompany } from "@/features/companies/service";
import { listEmployees } from "@/features/employees/service";
import { listJobs } from "@/features/jobs/service";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "dashboard");
  const tJobs = await getT(locale, "jobs");
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

  const jobs = await listJobs();
  const employees = await listEmployees();
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfWeek = new Date(startOfDay);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const isBetween = (date: Date, start: Date, end: Date) =>
    date >= start && date < end;

  const jobsToday = jobs
    .filter((job) => isBetween(new Date(job.scheduled_for), startOfDay, endOfDay))
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    )
    .slice(0, 7);

  const jobsThisWeek = jobs.filter((job) =>
    isBetween(new Date(job.scheduled_for), startOfWeek, endOfWeek)
  );

  const inProgress = jobs.filter((job) => job.status === "in_progress").length;
  const completedToday = jobsToday.filter((job) => job.status === "done").length;

  const cards = [
    { label: t("cards.jobsToday"), value: jobsToday.length },
    { label: t("cards.jobsWeek"), value: jobsThisWeek.length },
    { label: t("cards.inProgress"), value: inProgress },
    { label: t("cards.completedToday"), value: completedToday }
  ];

  const attentionItems = jobs
    .flatMap((job) => {
      const scheduled = new Date(job.scheduled_for);
      const isOverdue = scheduled < now && job.status !== "done";
      const isUnassigned = !job.assigned_employee_ids?.length;
      const shouldHaveStarted =
        scheduled < now && job.status === "scheduled";
      const reasons = [
        isOverdue ? t("attention.overdue") : null,
        isUnassigned ? t("attention.unassigned") : null,
        shouldHaveStarted ? t("attention.shouldStart") : null
      ].filter(Boolean) as string[];

      if (reasons.length === 0) {
        return [];
      }

      const customerLabel = job.customer_name ?? tJobs("detail.customerFallback");
      return reasons.map((reason) => ({
        id: `${job.id}-${reason}`,
        label: customerLabel,
        reason,
        href: `/jobs/${job.id}/edit`
      }));
    })
    .slice(0, 3);

  const upcomingJobs = jobs
    .filter((job) => new Date(job.scheduled_for) >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    )
    .slice(0, 5);

  const calendarDate = new Date(now);
  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const startOffset = (monthStart.getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];
  const monthLabel = calendarDate.toLocaleDateString(locale, {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
          <Section title={t("today.title")} description={t("today.subtitle")}>
            {jobsToday.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-center">
                <p className="text-base font-semibold text-slate-900">
                  {t("today.emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("today.emptySubtitle")}
                </p>
                <div className="mt-4 flex justify-center">
                  <Link href="/jobs/new">
                    <Button>{t("today.createJob")}</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {jobsToday.map((job) => {
                  const scheduled = new Date(job.scheduled_for);
                  const timeLabel = scheduled.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  const assignees =
                    job.assigned_employee_ids?.length
                      ? job.assigned_employee_ids
                          .map((id) => employeesById.get(id)?.full_name)
                          .filter(Boolean)
                          .join(", ")
                      : t("today.noAssignees");
                  const statusLabel = tJobs(`status.${job.status}`);
                  const statusStyles = {
                    scheduled: "bg-slate-100 text-slate-700",
                    in_progress: "bg-amber-50 text-amber-700",
                    done: "bg-emerald-50 text-emerald-700",
                    canceled: "bg-rose-50 text-rose-700"
                  }[job.status];

                  return (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-700"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {job.customer_name ?? tJobs("detail.customerFallback")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t("today.timeLabel")}: {timeLabel} • {assignees}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-end">
                  <Link
                    href="/jobs"
                    className="text-sm font-semibold text-brand-600"
                  >
                    {t("today.viewAll")}
                  </Link>
                </div>
              </div>
            )}
          </Section>

          <div className="space-y-6">
            {attentionItems.length > 0 ? (
              <Section
                title={t("attention.title")}
                description={t("attention.subtitle")}
              >
                <div className="space-y-2 text-sm text-slate-700">
                  {attentionItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-amber-100/80 bg-amber-50/80 px-4 py-3 transition hover:border-amber-200 hover:bg-amber-100"
                    >
                      <span className="font-semibold text-slate-900">
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-amber-700">
                        {item.reason}
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section title={t("quick.title")} description={t("quick.subtitle")}>
              <div className="flex flex-col gap-3">
                <Link href="/jobs/new" className="w-full">
                  <Button className="w-full">{t("quick.createJob")}</Button>
                </Link>
                <Link href="/employees/new" className="w-full">
                  <Button variant="secondary" className="w-full">
                    {t("quick.inviteEmployee")}
                  </Button>
                </Link>
                <Link href="/customers/new" className="w-full">
                  <Button variant="secondary" className="w-full">
                    {t("quick.addCustomer")}
                  </Button>
                </Link>
              </div>
            </Section>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {monthLabel}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-xs text-slate-600">
              {calendarCells.map((day, index) => {
                const isToday = day === now.getDate();
                return (
                  <span
                    key={`${day ?? "empty"}-${index}`}
                    className={`flex h-8 items-center justify-center rounded-lg ${
                      day
                        ? isToday
                          ? "bg-brand-600 text-white"
                          : "text-slate-700"
                        : "text-transparent"
                    }`}
                  >
                    {day ?? 0}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {t("today.title")}
            </p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              {upcomingJobs.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t("today.emptySubtitle")}
                </p>
              ) : (
                upcomingJobs.map((job) => {
                  const scheduled = new Date(job.scheduled_for);
                  const label = scheduled.toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric"
                  });
                  return (
                    <div key={job.id} className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {job.customer_name ?? tJobs("detail.customerFallback")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tJobs(`status.${job.status}`)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
