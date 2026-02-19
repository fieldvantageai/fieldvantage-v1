import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  TrendingUp,
  UserRound
} from "lucide-react";

import OpenInMapsButton from "@/components/common/OpenInMapsButton";
import AddressNotesModal from "@/components/customers/AddressNotesModal";
import StatusBadge from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getCustomerById, listCustomerJobs } from "@/features/customers/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

/* deterministic avatar color (server-safe, no hooks) */
const AVATAR_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-blue-100",   text: "text-blue-700",   ring: "ring-blue-200"   },
  { bg: "bg-emerald-100",text: "text-emerald-700", ring: "ring-emerald-200"},
  { bg: "bg-amber-100",  text: "text-amber-700",  ring: "ring-amber-200"  },
  { bg: "bg-rose-100",   text: "text-rose-700",   ring: "ring-rose-200"   },
  { bg: "bg-cyan-100",   text: "text-cyan-700",   ring: "ring-cyan-200"   },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" },
  { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" },
];

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "customers");
  const customer = await getCustomerById(id);
  const jobs = await listCustomerJobs(id);

  if (!customer) notFound();

  const name = customer.name?.trim() || "Cliente";
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  const totalJobs       = jobs.length;
  const inProgressJobs  = jobs.filter((j) => j.status === "in_progress").length;
  const completedJobs   = jobs.filter((j) => j.status === "done").length;

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
    <div className="space-y-6">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ring-2 ${color.bg} ${color.text} ${color.ring}`}
          >
            {customer.avatar_signed_url ? (
              <img
                src={customer.avatar_signed_url}
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
              {customer.company_name ? (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {customer.company_name}
                </span>
              ) : null}
              {customer.email ? (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {customer.email}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <Link href={`/customers/${customer.id}/edit`}>
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

      {/* ── Contact + Addresses ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <UserRound className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("detail.summary.title")}</p>
            <p className="text-xs text-slate-500">{t("detail.summary.subtitle")}</p>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-slate-100">
          {/* Contact */}
          <div className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t("detail.summary.contact")}
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              {customer.email ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <a href={`mailto:${customer.email}`} className="truncate hover:text-brand-600 hover:underline">
                    {customer.email}
                  </a>
                </li>
              ) : null}
              {customer.phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <a href={`tel:${customer.phone}`} className="hover:text-brand-600 hover:underline">
                    {customer.phone}
                  </a>
                </li>
              ) : null}
              {customer.company_name ? (
                <li className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{customer.company_name}</span>
                </li>
              ) : null}
              {!customer.email && !customer.phone && !customer.company_name ? (
                <li className="text-slate-400">—</li>
              ) : null}
            </ul>
          </div>

          {/* Addresses */}
          <div className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t("detail.summary.address")}
            </p>
            {customer.addresses?.length ? (
              <div className="space-y-3">
                {customer.addresses.map((address, index) => {
                  const isPrimary =
                    address.is_primary ||
                    (!customer.addresses.some((a) => a.is_primary) && index === 0);
                  const notes = address.note ?? "";
                  return (
                    <div
                      key={address.id}
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        isPrimary
                          ? "border-brand-200/70 bg-brand-50/40"
                          : "border-slate-200/70 bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`h-4 w-4 shrink-0 ${isPrimary ? "text-brand-500" : "text-slate-400"}`} />
                          <span className="font-semibold text-slate-900">
                            {address.label || t("detail.address.fallbackLabel")}
                          </span>
                          {isPrimary ? (
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                              {t("detail.address.primary")}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <OpenInMapsButton address={address} label="Abrir no mapa" />
                          {notes ? (
                            <AddressNotesModal notes={notes} label={t("detail.address.notes")} />
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-1.5 pl-6 text-slate-600">
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
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Orders ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        {/* Section header */}
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
          {jobs.length > 0 ? (
            <Link
              href={{
                pathname: "/jobs/new",
                query: { customerId: customer.id, customerName: customer.name }
              }}
            >
              <Button variant="secondary" className="gap-2 text-xs">
                <Briefcase className="h-3.5 w-3.5" />
                {t("actions.newJob")}
              </Button>
            </Link>
          ) : null}
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-slate-700">{t("detail.jobs.empty")}</p>
            <Link
              href={{
                pathname: "/jobs/new",
                query: { customerId: customer.id, customerName: customer.name }
              }}
            >
              <Button variant="secondary" className="gap-2 mt-1">
                <Briefcase className="h-4 w-4" />
                {t("actions.newJob")}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_160px_100px] items-center gap-4 border-b border-slate-100 px-5 py-2.5 sm:grid">
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
                const dateLabel = dateFormatter.format(scheduled);
                const timeLabel = timeFormatter.format(scheduled);
                return (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_120px_160px_auto]"
                    >
                      {/* Title */}
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {job.title ?? t("detail.jobs.titleFallback")}
                      </p>

                      {/* Status */}
                      <div className="flex items-center">
                        <StatusBadge status={job.status} />
                      </div>

                      {/* Date + time */}
                      <div className="hidden items-center gap-3 sm:flex">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {dateLabel}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {timeLabel}
                        </span>
                      </div>

                      {/* Arrow */}
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
