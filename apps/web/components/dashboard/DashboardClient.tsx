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
  Users,
  UserX
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
  const { t: tCommon } = useClientT("common");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const pollRef = useRef<number | null>(null);
  const [riskPanelOpen, setRiskPanelOpen] = useState(false);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  useEffect(() => {
    setSnapshot(initialSnapshot);
    if (isSwitchingCompany) {
      setIsSwitchingCompany(false);
      window.dispatchEvent(new CustomEvent("fv-company-switching-complete"));
    }
  }, [initialSnapshot]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ isSwitching: boolean }>).detail;
      if (typeof detail?.isSwitching === "boolean") {
        setIsSwitchingCompany(detail.isSwitching);
        if (detail.isSwitching) {
          setRiskPanelOpen(false);
        }
      }
    };
    window.addEventListener("fv-company-switching", handler);
    return () => {
      window.removeEventListener("fv-company-switching", handler);
    };
  }, []);

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
      href: `/jobs?from=${toDateParam(new Date())}&to=${toDateParam(new Date())}`,
      card: "bg-white/95 border-slate-200/70",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
      valueColor: "text-slate-900"
    },
    {
      label: t("cards.inProgressNow"),
      value: snapshot.metrics.in_progress_now,
      icon: TrendingUp,
      href: "/jobs?status=in_progress",
      card: "bg-blue-50/60 border-blue-200/70",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-blue-800"
    },
    {
      label: t("cards.overdue"),
      value: snapshot.metrics.overdue,
      icon: AlertTriangle,
      href: `/jobs?to=${toDateParam(
        new Date(new Date().setDate(new Date().getDate() - 1))
      )}&status=in_progress`,
      card: "bg-amber-50/60 border-amber-200/70",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-900"
    },
    {
      label: t("cards.unassigned"),
      value: snapshot.metrics.unassigned,
      icon: UserX,
      href: "/jobs?unassigned=1",
      card: "bg-red-50/60 border-red-200/70",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      valueColor: "text-red-900"
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
      icon: AlertTriangle,
      chipCls: "border-amber-200/80 bg-amber-50 hover:bg-amber-100",
      iconCls: "text-amber-500",
      countCls: "bg-amber-100 text-amber-700"
    },
    {
      key: "shouldStart",
      label: t("attention.shouldStart"),
      count: snapshot.attention.should_start.length,
      href: "/jobs?status=scheduled",
      icon: Clock,
      chipCls: "border-orange-200/80 bg-orange-50 hover:bg-orange-100",
      iconCls: "text-orange-500",
      countCls: "bg-orange-100 text-orange-700"
    },
    {
      key: "unassigned",
      label: t("attention.unassigned"),
      count: snapshot.attention.unassigned.length,
      href: "/jobs?unassigned=1",
      icon: UserMinus,
      chipCls: "border-red-200/80 bg-red-50 hover:bg-red-100",
      iconCls: "text-red-500",
      countCls: "bg-red-100 text-red-700"
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

      <div className={`relative space-y-8 ${isSwitchingCompany ? "pointer-events-none" : ""}`}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isSwitchingCompany
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`card-skeleton-${index}`}
                className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))
          : cards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.card}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <span className={`rounded-full p-2 ${item.iconBg}`}>
                      <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    </span>
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${item.valueColor}`}>
                    {item.value}
                  </p>
                </Link>
              );
            })}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-5 py-3">
        {isSwitchingCompany ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-100" />
          </div>
        ) : (() => {
          const planned = snapshot.metrics.planned_today;
          const completed = snapshot.metrics.completed_today;
          const inProgress = snapshot.metrics.in_progress_today;
          const remaining = snapshot.metrics.remaining_today;
          const pct = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
          return (
            <div className="space-y-2.5">
              {planned > 0 ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-500">
                    {t("progress.plannedLabel")}{" "}
                    <span className="font-semibold text-slate-700">{planned}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">
                    {t("progress.completedLabel")}{" "}
                    <span className="font-semibold text-emerald-600">{completed}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">
                    {t("progress.inProgressLabel")}{" "}
                    <span className="font-semibold text-blue-600">{inProgress}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">
                    {t("progress.remainingLabel")}{" "}
                    <span className="font-semibold text-slate-700">{remaining}</span>
                  </span>
                  {pct > 0 ? (
                    <span
                      className={`ml-auto text-xs font-bold ${
                        pct === 100 ? "text-emerald-600" : "text-brand-600"
                      }`}
                    >
                      {pct}%
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm text-slate-500">{t("progress.empty")}</span>
              )}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-brand-500" : ""
                  }`}
                  style={{ width: `${pct}%` }}
                />
                {pct === 0 && planned > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-[10px] font-semibold text-slate-400">0%</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })()}
        </div>

        <div
        className={`rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-2 transition ${
          canExpandRiskPanel && !isSwitchingCompany
            ? "cursor-pointer hover:bg-slate-50/70"
            : ""
        }`}
        role={canExpandRiskPanel && !isSwitchingCompany ? "button" : undefined}
        tabIndex={canExpandRiskPanel && !isSwitchingCompany ? 0 : -1}
        aria-expanded={
          canExpandRiskPanel && !isSwitchingCompany ? riskPanelOpen : undefined
        }
        onClick={() => {
          if (canExpandRiskPanel && !isSwitchingCompany) {
            setRiskPanelOpen((prev) => !prev);
          }
        }}
        onKeyDown={(event) => {
          if (!canExpandRiskPanel || isSwitchingCompany) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setRiskPanelOpen((prev) => !prev);
          }
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {isSwitchingCompany ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
              <div className="h-6 w-32 animate-pulse rounded-full bg-slate-100" />
              <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
            </div>
          ) : canExpandRiskPanel ? (
            <div className="flex flex-wrap items-center gap-2">
              {visibleRiskChips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <Link
                    key={chip.key}
                    href={chip.href}
                    onClick={(event) => event.stopPropagation()}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-slate-700 transition ${chip.chipCls}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${chip.iconCls}`} />
                    <span>{chip.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip.countCls}`}>
                      {chip.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("riskStrip.empty")}</p>
          )}
          {canExpandRiskPanel && !isSwitchingCompany ? (
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
          <Section
            title={
              <span className="flex items-center gap-2">
                {t("live.title")}
                {snapshot.lists.live_executions.length > 0 ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {snapshot.lists.live_executions.length}
                  </span>
                ) : null}
              </span>
            }
            description={t("live.subtitle")}
          >
            {isSwitchingCompany ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`live-skeleton-${index}`}
                    className="rounded-3xl border border-slate-200/70 bg-white/95 px-4 py-3"
                  >
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : snapshot.lists.live_executions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-center">
                <p className="text-base font-semibold text-slate-900">
                  {t("live.emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("live.emptySubtitle")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshot.lists.live_executions.map((job) => {
                  const startTime = formatTime(job.scheduled_for);
                  const hasAssignees = job.assigned_names.length > 0;
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {job.title ?? tJobs("table.titleFallback")}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {job.customer_name ?? tJobs("detail.customerFallback")}
                        </p>
                        {hasAssignees ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <Users className="h-3 w-3 shrink-0" />
                            <span className="truncate">{job.assigned_names.join(", ")}</span>
                          </p>
                        ) : (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-500">
                            <UserX className="h-3 w-3 shrink-0" />
                            <span>{t("live.noAssignees")}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Clock className="h-3 w-3" />
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

          <Section
            title={
              <span className="flex items-center gap-2">
                {t("today.title")}
                {snapshot.lists.todays_orders.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {snapshot.metrics.jobs_today}
                  </span>
                ) : null}
              </span>
            }
            description={t("today.subtitle")}
          >
            {isSwitchingCompany ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`today-skeleton-${index}`}
                    className="rounded-3xl border border-slate-200/70 bg-white/95 px-4 py-3"
                  >
                    <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : snapshot.lists.todays_orders.length === 0 ? (
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
          {isSwitchingCompany ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1">
                {Array.from({ length: 21 }).map((_, index) => (
                  <div
                    key={`calendar-skeleton-${index}`}
                    className="h-8 animate-pulse rounded bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ) : (
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
          )}

          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {t("upcoming.title")}
            </p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              {isSwitchingCompany ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={`upcoming-skeleton-${index}`}
                      className="rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2"
                    >
                      <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : snapshot.lists.upcoming_executions.length === 0 ? (
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
                <Link
                  href="/jobs/new"
                  className={`w-full ${isSwitchingCompany ? "pointer-events-none" : ""}`}
                >
                  <Button className="w-full" disabled={isSwitchingCompany}>
                    {t("quick.createJob")}
                  </Button>
                </Link>
                <Link
                  href="/customers/new"
                  className={`w-full ${isSwitchingCompany ? "pointer-events-none" : ""}`}
                >
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={isSwitchingCompany}
                  >
                    {t("quick.addCustomer")}
                  </Button>
                </Link>
                <Link
                  href="/employees/new"
                  className={`w-full ${isSwitchingCompany ? "pointer-events-none" : ""}`}
                >
                  <Button
                    variant="ghost"
                    className="w-full gap-2"
                    disabled={isSwitchingCompany}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("quick.inviteEmployee")}
                  </Button>
                </Link>
              </div>
            </Section>
          )}
        </div>
        </div>
        {isSwitchingCompany ? (
          <div className="pointer-events-auto absolute inset-0 z-10 flex items-start justify-center">
            <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-2 text-sm text-slate-600 shadow-sm">
              {tCommon("status.loading")}
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
