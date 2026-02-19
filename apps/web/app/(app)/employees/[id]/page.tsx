import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  Mail,
  Pencil,
  Phone,
  Shield,
  TrendingUp,
  UserRound,
} from "lucide-react";

import EmployeeInvitePanel from "@/components/employees/EmployeeInvitePanel";
import StatusBadge from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getEmployeeById, listEmployeeJobs } from "@/features/employees/service";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

const AVATAR_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-sky-100",    text: "text-sky-700",    ring: "ring-sky-200"    },
  { bg: "bg-amber-100",  text: "text-amber-700",  ring: "ring-amber-200"  },
  { bg: "bg-emerald-100",text: "text-emerald-700",ring: "ring-emerald-200"},
  { bg: "bg-rose-100",   text: "text-rose-700",   ring: "ring-rose-200"   },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" },
  { bg: "bg-teal-100",   text: "text-teal-700",   ring: "ring-teal-200"   },
  { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" },
];

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "employees");
  const tCommon = await getT(locale, "common");

  const employee = await getEmployeeById(id);
  const jobs = await listEmployeeJobs(id);

  if (!employee) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: pendingInvite } = await supabase
    .from("invites")
    .select("id, status, expires_at")
    .eq("employee_id", employee.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .maybeSingle();

  const name = employee.full_name?.trim() || "Colaborador";
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  const totalJobs     = jobs.length;
  const inProgressJobs = jobs.filter((j) => j.status === "in_progress").length;
  const completedJobs  = jobs.filter((j) => j.status === "done").length;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ring-2 ${color.bg} ${color.text} ${color.ring}`}
          >
            {employee.avatar_signed_url ? (
              <img
                src={employee.avatar_signed_url}
                alt={name}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {getEmployeeRoleLabel(employee.role)}
              </span>
              {employee.email ? (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {employee.email}
                </span>
              ) : null}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  employee.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {employee.status === "active"
                  ? tCommon("status.active")
                  : tCommon("status.inactive")}
              </span>
            </div>
          </div>
        </div>

        <Link href={`/employees/${employee.id}/edit`}>
          <Button className="gap-2">
            <Pencil className="h-4 w-4" />
            {t("detail.edit")}
          </Button>
        </Link>
      </header>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Briefcase className="h-3.5 w-3.5" />
            {t("detail.stats.total")}
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalJobs}</p>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-2xl border border-blue-200/70 bg-blue-50/60 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-500">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("detail.stats.inProgress")}
          </div>
          <p className="text-2xl font-bold text-blue-700">{inProgressJobs}</p>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("detail.stats.completed")}
          </div>
          <p className="text-2xl font-bold text-emerald-700">{completedJobs}</p>
        </div>
      </div>

      {/* ── Contact info ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <UserRound className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t("detail.summary.title")}
            </p>
            <p className="text-xs text-slate-500">{t("detail.summary.subtitle")}</p>
          </div>
        </div>

        <div className="p-5">
          <ul className="space-y-3 text-sm">
            {employee.email ? (
              <li className="flex items-center gap-3 text-slate-700">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <a
                  href={`mailto:${employee.email}`}
                  className="hover:text-brand-600 hover:underline"
                >
                  {employee.email}
                </a>
              </li>
            ) : null}
            {employee.phone ? (
              <li className="flex items-center gap-3 text-slate-700">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <a
                  href={`tel:${employee.phone}`}
                  className="hover:text-brand-600 hover:underline"
                >
                  {employee.phone}
                </a>
              </li>
            ) : (
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="h-4 w-4 shrink-0" />
                {t("detail.summary.phoneFallback")}
              </li>
            )}
            {!employee.email && !employee.phone ? (
              <li className="text-slate-400">—</li>
            ) : null}
          </ul>
        </div>
      </div>

      {/* ── Invite panel ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t("detail.invite.title")}
            </p>
            <p className="text-xs text-slate-500">{t("detail.invite.subtitle")}</p>
          </div>
        </div>
        <div className="p-5">
          <EmployeeInvitePanel
            employeeId={employee.id}
            email={employee.email ?? null}
            invitationStatus={employee.invitation_status ?? null}
            userId={employee.user_id ?? null}
            initialInviteStatus={(pendingInvite?.status as "pending") ?? null}
            initialInviteExpiresAt={pendingInvite?.expires_at ?? null}
          />
        </div>
      </div>

      {/* ── Jobs ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                {t("detail.jobs.title")}
                {jobs.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {jobs.length}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">{t("detail.jobs.subtitle")}</p>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-slate-700">{t("detail.jobs.empty")}</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_160px_16px] items-center gap-4 border-b border-slate-100 px-5 py-2.5 sm:grid">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("detail.jobs.colTitle")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("detail.jobs.colStatus")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("detail.jobs.colDate")}
              </span>
              <span />
            </div>

            <ul className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const scheduled = new Date(job.scheduled_for);
                return (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_120px_160px_auto]"
                    >
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {job.title ?? job.customer_name ?? t("detail.jobs.titleFallback")}
                      </p>

                      <div className="flex items-center">
                        <StatusBadge status={job.status} />
                      </div>

                      <div className="hidden items-center gap-3 sm:flex">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {dateFormatter.format(scheduled)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {timeFormatter.format(scheduled)}
                        </span>
                      </div>

                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        className="shrink-0 text-slate-300"
                        fill="none"
                      >
                        <path
                          d="M9 18l6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

    </div>
  );
}
