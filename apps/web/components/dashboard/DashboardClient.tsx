"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronDown,
  ClipboardList,
  Clock,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users
} from "lucide-react";

import type { DashboardSnapshot } from "@/features/dashboard/service";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import StatusBadge from "@/components/orders/StatusBadge";
import { useClientT } from "@/lib/i18n/useClientT";
import RiskControlPanel from "./RiskControlPanel";

type DashboardClientProps = {
  initialSnapshot: DashboardSnapshot;
  locale: string;
  isMember: boolean;
};

const toDateParam = (date: Date) => date.toISOString().split("T")[0];

export default function DashboardClient({
  initialSnapshot,
  locale,
  isMember
}: DashboardClientProps) {
  const { t } = useClientT("dashboard");
  const { t: tJobs } = useClientT("jobs");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const pollRef = useRef<number | null>(null);
  const [riskPanelOpen, setRiskPanelOpen] = useState(false);

  useEffect(() => {
    setLastUpdatedAt(Date.now());
    setSecondsSinceUpdate(0);
  }, [snapshot.generated_at]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsSinceUpdate(
        Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000))
      );
    }, 1000);
    return () => window.clearInterval(tick);
  }, [lastUpdatedAt]);

  const lastUpdatedLabel = useMemo(() => {
    if (secondsSinceUpdate < 10) {
      return t("lastUpdated.justNow");
    }
    if (secondsSinceUpdate < 60) {
      return t("lastUpdated.lessThanMinute");
    }
    const minutes = Math.floor(secondsSinceUpdate / 60);
    return `${t("lastUpdated.minutesPrefix")} ${minutes} ${t(
      "lastUpdated.minutesSuffix"
    )}`;
  }, [secondsSinceUpdate, t]);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { data?: DashboardSnapshot };
        if (payload.data) {
          setSnapshot(payload.data);
        }
      }
    };

    fetchSnapshot();
    pollRef.current = window.setInterval(fetchSnapshot, 60000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSnapshot();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const cards = [
    {
      label: t("cards.jobsToday"),
      value: snapshot.metrics.jobs_today,
      icon: ClipboardList,
      href: `/jobs?from=${toDateParam(new Date())}&to=${toDateParam(new Date())}`
    },
    {
      label: t("cards.inProgressNow"),
      value: snapshot.metrics.in_progress_now,
      icon: TrendingUp,
      href: "/jobs?status=in_progress"
    },
    {
      label: t("cards.overdue"),
      value: snapshot.metrics.overdue,
      icon: AlertTriangle,
      href: `/jobs?to=${toDateParam(
        new Date(new Date().setDate(new Date().getDate() - 1))
      )}&status=in_progress`
    },
    {
      label: t("cards.unassigned"),
      value: snapshot.metrics.unassigned,
      icon: Users,
      href: "/jobs?unassigned=1"
    }
  ];

  const jobsByDate = useMemo(() => {
    const map = new Map<string, number>();
    snapshot.jobs_by_date.forEach((entry) => {
      map.set(entry.date, entry.count);
    });
    return map;
  }, [snapshot.jobs_by_date]);

  const calendarDate = useMemo(() => new Date(snapshot.generated_at), [snapshot]);
  const monthStart = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    0
  );
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

  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit"
    });

  const getInitials = (name?: string | null) => {
    if (!name) {
      return "--";
    }
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };

  const riskChips = [
    {
      key: "overdue",
      label: t("attention.overdue"),
      count: snapshot.attention.overdue.length,
      href: `/jobs?to=${toDateParam(
        new Date(new Date().setDate(new Date().getDate() - 1))
      )}&status=in_progress`,
      icon: AlertTriangle
    },
    {
      key: "shouldStart",
      label: t("attention.shouldStart"),
      count: snapshot.attention.should_start.length,
      href: "/jobs?status=scheduled",
      icon: Clock
    },
    {
      key: "unassigned",
      label: t("attention.unassigned"),
      count: snapshot.attention.unassigned.length,
      href: "/jobs?unassigned=1",
      icon: UserMinus
    }
  ];
  const visibleRiskChips = riskChips.filter((chip) => chip.count > 0);
  const riskSum = riskChips.reduce((total, chip) => total + chip.count, 0);
  const canExpandRiskPanel = riskSum > 0;

  useEffect(() => {
    if (!canExpandRiskPanel) {
      setRiskPanelOpen(false);
    }
  }, [canExpandRiskPanel]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{t("subtitle")}</span>
          <span>•</span>
          <span>{lastUpdatedLabel}</span>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <span className="rounded-full bg-slate-100 p-2 text-slate-500">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-2 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          {snapshot.metrics.planned_today > 0 ? (
            <>
              <span>
                {t("progress.plannedLabel")} {snapshot.metrics.planned_today}
              </span>
              <span>
                {t("progress.completedLabel")} {snapshot.metrics.completed_today}
              </span>
              <span>
                {t("progress.inProgressLabel")} {snapshot.metrics.in_progress_today}
              </span>
              <span>
                {t("progress.remainingLabel")} {snapshot.metrics.remaining_today}
              </span>
            </>
          ) : (
            <span>{t("progress.empty")}</span>
          )}
          <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-brand-600"
              style={{
                width:
                  snapshot.metrics.planned_today > 0
                    ? `${Math.min(
                        100,
                        (snapshot.metrics.completed_today /
                          snapshot.metrics.planned_today) *
                          100
                      )}%`
                    : "0%"
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-2 transition ${
          canExpandRiskPanel ? "cursor-pointer hover:bg-slate-50/70" : ""
        }`}
        role={canExpandRiskPanel ? "button" : undefined}
        tabIndex={canExpandRiskPanel ? 0 : -1}
        aria-expanded={canExpandRiskPanel ? riskPanelOpen : undefined}
        onClick={() => {
          if (canExpandRiskPanel) {
            setRiskPanelOpen((prev) => !prev);
          }
        }}
        onKeyDown={(event) => {
          if (!canExpandRiskPanel) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setRiskPanelOpen((prev) => !prev);
          }
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {canExpandRiskPanel ? (
            <div className="flex flex-wrap items-center gap-2">
              {visibleRiskChips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <Link
                    key={chip.key}
                    href={chip.href}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-500" />
                    <span>{chip.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {chip.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("riskStrip.empty")}</p>
          )}
          {canExpandRiskPanel ? (
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                riskPanelOpen ? "rotate-180" : ""
              }`}
            />
          ) : null}
        </div>
      </div>

      {canExpandRiskPanel ? (
        <div
          className={`overflow-hidden transition-all duration-200 ${
            riskPanelOpen
              ? "max-h-[1200px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="mt-4 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("risk.title")}
            </h2>
            <RiskControlPanel
              categories={[
                {
                  key: "overdue",
                  title: t("attention.overdue"),
                  count: snapshot.attention.overdue.length,
                  items: snapshot.attention.overdue.map((item) => ({
                    id: item.id,
                    title: item.title ?? tJobs("table.titleFallback"),
                    customer: item.customer_name ?? tJobs("detail.customerFallback"),
                    href: `/jobs/${item.id}`
                  }))
                },
                {
                  key: "shouldStart",
                  title: t("attention.shouldStart"),
                  count: snapshot.attention.should_start.length,
                  items: snapshot.attention.should_start.map((item) => ({
                    id: item.id,
                    title: item.title ?? tJobs("table.titleFallback"),
                    customer: item.customer_name ?? tJobs("detail.customerFallback"),
                    href: `/jobs/${item.id}`
                  }))
                },
                {
                  key: "unassigned",
                  title: t("attention.unassigned"),
                  count: snapshot.attention.unassigned.length,
                  items: snapshot.attention.unassigned.map((item) => ({
                    id: item.id,
                    title: item.title ?? tJobs("table.titleFallback"),
                    customer: item.customer_name ?? tJobs("detail.customerFallback"),
                    href: `/jobs/${item.id}`
                  }))
                }
              ]}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
        <div className="space-y-6">
          <Section title={t("live.title")} description={t("live.subtitle")}>
            {snapshot.lists.live_executions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-center">
                <p className="text-base font-semibold text-slate-900">
                  {t("live.emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("live.emptySubtitle")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshot.lists.live_executions.map((job) => {
                  const startTime = formatTime(job.scheduled_for);
                  const assignees =
                    job.assigned_names.length > 0
                      ? job.assigned_names.join(", ")
                      : t("live.noAssignees");
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-200 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {job.title ?? tJobs("table.titleFallback")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {job.customer_name ?? tJobs("detail.customerFallback")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {assignees}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {startTime}
                        </span>
                        <StatusBadge status="in_progress" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title={t("today.title")} description={t("today.subtitle")}>
            {snapshot.lists.todays_orders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-center">
                <p className="text-base font-semibold text-slate-900">
                  {t("today.emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("today.emptySubtitle")}
                </p>
                {isMember ? null : (
                  <div className="mt-4 flex justify-center">
                    <Link href="/jobs/new">
                      <Button>{t("today.createJob")}</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {snapshot.lists.todays_orders.map((job) => {
                  const customerLabel =
                    job.customer_name ?? tJobs("detail.customerFallback");
                  const avatarLabel = getInitials(customerLabel);
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-200 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                          {avatarLabel}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {job.title ?? tJobs("table.titleFallback")}
                          </p>
                          <p className="text-xs text-slate-500">{customerLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatTime(job.scheduled_for)}
                        </span>
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  );
                })}
                {snapshot.metrics.jobs_today > 5 ? (
                  <div className="flex justify-end">
                    <Link
                      href="/jobs"
                      className="text-sm font-semibold text-brand-600"
                    >
                      {t("today.viewAll")}
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
              <CalendarIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-xs text-slate-600">
              {calendarCells.map((day, index) => {
                const isToday = day === new Date().getDate();
                const dateKey = day
                  ? toDateParam(
                      new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth(),
                        day
                      )
                    )
                  : "";
                const count = day ? jobsByDate.get(dateKey) ?? 0 : 0;
                return (
                  <div key={`${day ?? "empty"}-${index}`} className="h-10">
                    {day ? (
                      <Link
                        href={`/jobs?from=${dateKey}&to=${dateKey}`}
                        className={`flex h-8 items-center justify-center rounded-lg transition ${
                          isToday
                            ? "bg-brand-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                      </Link>
                    ) : (
                      <span className="flex h-8 items-center justify-center text-transparent">
                        0
                      </span>
                    )}
                    {count > 0 ? (
                      <div className="mt-0.5 flex justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      </div>
                    ) : (
                      <div className="mt-0.5 h-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {t("upcoming.title")}
            </p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              {snapshot.lists.upcoming_executions.length === 0 ? (
                <p className="text-sm text-slate-500">{t("upcoming.empty")}</p>
              ) : (
                snapshot.lists.upcoming_executions.map((job) => {
                  const scheduled = new Date(job.scheduled_for);
                  const label = scheduled.toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric"
                  });
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 transition hover:border-slate-200 hover:shadow-sm"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {label}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {job.customer_name ?? tJobs("detail.customerFallback")}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {isMember ? null : (
            <Section title={t("quick.title")} description={t("quick.subtitle")}>
              <div className="flex flex-col gap-3">
                <Link href="/jobs/new" className="w-full">
                  <Button className="w-full">{t("quick.createJob")}</Button>
                </Link>
                <Link href="/customers/new" className="w-full">
                  <Button variant="secondary" className="w-full">
                    {t("quick.addCustomer")}
                  </Button>
                </Link>
                <Link href="/employees/new" className="w-full">
                  <Button variant="ghost" className="w-full gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t("quick.inviteEmployee")}
                  </Button>
                </Link>
              </div>
            </Section>
          )}
        </div>
      </div>

    </div>
  );
}
