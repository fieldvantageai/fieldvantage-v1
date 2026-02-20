"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronDown,
  ClipboardList,
  Clock,
  Info,
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

  const calendarDayMap = useMemo(() => {
    const map = new Map<string, typeof snapshot.jobs_by_date[0]>();
    snapshot.jobs_by_date.forEach((entry) => map.set(entry.date, entry));
    return map;
  }, [snapshot.jobs_by_date]);

  const calendarDate = useMemo(() => new Date(snapshot.generated_at), [snapshot]);
  const todayDateKey = toDateParam(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayDateKey);
  const [legendOpen, setLegendOpen] = useState(false);

  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const startOffset = (monthStart.getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const monthLabel = (() => {
    const raw = calendarDate.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });
    // Normalize any capitalised connector words (e.g. "Fevereiro De 2026" → "Fevereiro de 2026")
    return raw.replace(/\b(De|Del|Of)\b/g, (m) => m.toLowerCase());
  })();

  const selectedDayData = calendarDayMap.get(selectedDateKey);
  const selectedDayLabel = (() => {
    const raw = new Date(selectedDateKey + "T12:00:00").toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return raw.replace(/\b(De|Del|Of)\b/g, (m) => m.toLowerCase());
  })();

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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {isSwitchingCompany
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`card-skeleton-${index}`}
                className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100 sm:w-24" />
                  <div className="h-7 w-7 animate-pulse rounded-full bg-slate-100 sm:h-8 sm:w-8" />
                </div>
                <div className="mt-2 h-6 w-12 animate-pulse rounded bg-slate-100 sm:mt-3 sm:h-7 sm:w-16" />
              </div>
            ))
          : cards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-5 ${item.card}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs">
                      {item.label}
                    </p>
                    <span className={`shrink-0 rounded-full p-1.5 sm:p-2 ${item.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.iconColor}`} />
                    </span>
                  </div>
                  <p className={`mt-2 text-2xl font-bold sm:mt-3 sm:text-3xl ${item.valueColor}`}>
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
            <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm">
              {/* Calendar header */}
              <div className="flex items-center justify-between px-5 pt-5">
                <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
                <div className="flex items-center gap-2">
                  {/* Legend tooltip — click/tap to toggle (works on mobile) */}
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={t("calendar.legendLabel")}
                      aria-expanded={legendOpen}
                      onClick={() => setLegendOpen((prev) => !prev)}
                      className="flex items-center justify-center rounded-full p-0.5 text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    {legendOpen ? (
                      <>
                        {/* Backdrop to close on outside tap (mobile-friendly) */}
                        <div
                          className="fixed inset-0 z-10"
                          aria-hidden="true"
                          onClick={() => setLegendOpen(false)}
                        />
                        <div className="absolute right-0 top-6 z-20 w-48 rounded-xl border border-slate-200/80 bg-white p-3 shadow-lg">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {t("calendar.legendTitle")}
                          </p>
                          <ul className="space-y-1.5">
                            <li className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                              {t("calendar.legendOverdue")}
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                              {t("calendar.legendActive")}
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                              {t("calendar.legendInactive")}
                            </li>
                          </ul>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Day-of-week labels */}
              <div className="mt-4 grid grid-cols-7 gap-1 px-3 text-center text-xs text-slate-400">
                {["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>

              {/* Days grid */}
              <div className="mt-2 grid grid-cols-7 gap-1 px-3 pb-4 text-xs text-slate-600">
                {calendarCells.map((day, index) => {
                  const isToday = day !== null &&
                    toDateParam(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)) === todayDateKey;
                  const dateKey = day
                    ? toDateParam(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day))
                    : "";
                  const dayData = day ? calendarDayMap.get(dateKey) : undefined;
                  const isSelected = dateKey === selectedDateKey;

                  // Dot color priority
                  let dotColor = "";
                  if (dayData) {
                    if (dayData.hasOverdue) dotColor = "bg-red-500";
                    else if (dayData.hasActive) dotColor = "bg-blue-600";
                    else dotColor = "bg-slate-300";
                  }

                  // When today has overdue jobs, show a red ring on the blue circle
                  const todayRing = isToday && dayData?.hasOverdue ? "ring-2 ring-red-400 ring-offset-1" : "";

                  return (
                    <div key={`${day ?? "empty"}-${index}`} className="h-10">
                      {day ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDateKey(dateKey)}
                          className={`flex h-8 w-full items-center justify-center rounded-lg font-medium transition ${
                            isToday
                              ? `bg-brand-600 text-white hover:bg-brand-700 ${todayRing}`
                              : isSelected
                                ? "bg-slate-200 text-slate-900"
                                : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {day}
                        </button>
                      ) : (
                        <span className="flex h-8 items-center justify-center text-transparent">0</span>
                      )}
                      <div className="mt-0.5 flex justify-center">
                        {dotColor ? (
                          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        ) : (
                          <span className="h-1.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agenda View */}
              <div className="border-t border-slate-100">
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-xs font-semibold capitalize text-slate-500">
                    {selectedDateKey === todayDateKey ? t("calendar.today") : selectedDayLabel}
                  </p>
                  {selectedDayData && selectedDayData.jobs.length > 0 ? (
                    <Link
                      href={`/jobs?from=${selectedDateKey}&to=${selectedDateKey}`}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      {t("calendar.viewAll")}
                    </Link>
                  ) : null}
                </div>

                {selectedDayData && selectedDayData.jobs.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {selectedDayData.jobs.slice(0, 5).map((job) => {
                      const timeLabel = new Date(job.scheduled_for).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const dotCls =
                        job.status === "in_progress" && new Date(job.scheduled_for) < new Date()
                          ? "bg-red-500"
                          : job.status === "in_progress" || job.status === "scheduled"
                            ? "bg-blue-600"
                            : "bg-slate-300";
                      return (
                        <li key={job.id}>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-slate-50"
                          >
                            <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dotCls}`} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                              {job.title ?? tJobs("table.titleFallback")}
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">{timeLabel}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-5 pb-4 text-xs text-slate-400">
                    {t("calendar.noOrders")}
                  </p>
                )}
              </div>
            </div>
          )}

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
