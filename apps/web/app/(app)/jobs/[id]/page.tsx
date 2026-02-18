import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Calendar,
  Check,
  Clock,
  ClipboardList,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  StickyNote,
  User,
  Users,
  X
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import OrderHistoryTimeline from "@/components/orders/OrderHistoryTimeline";
import StatusBadge from "@/components/orders/StatusBadge";
import OpenInMapsButton from "@/components/common/OpenInMapsButton";
import { getCustomerById } from "@/features/customers/service";
import { getJobById, listOrderStatusEventsWithActors } from "@/features/jobs/service";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const tCommon = await getT(locale, "common");
  const supabase = await createSupabaseServerClient();
  const context = await getActiveCompanyContext();
  const isCollaborator = context?.role === "member";
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }
  const assignedMembershipIds = job.assigned_membership_ids ?? [];
  const assignedEmployees =
    assignedMembershipIds.length > 0
      ? (
          await (async () => {
            const { data: memberships } = await supabase
              .from("company_memberships")
              .select("id, user_id")
              .in("id", assignedMembershipIds);
            const userIds = (memberships ?? [])
              .map((item) => item.user_id as string)
              .filter(Boolean);
            const { data: profiles } = userIds.length
              ? await supabase
                  .from("employees")
                  .select("id, user_id, full_name, email")
                  .in("user_id", userIds)
              : { data: [] };
            const profileByUserId = new Map(
              (profiles ?? []).map((employee) => [employee.user_id, employee])
            );
            return (memberships ?? []).map((membership) => ({
              membership_id: membership.id,
              profile: profileByUserId.get(membership.user_id)
            }));
          })()
        )
      : [];
  const assignedEmployeesByMembershipId = new Map(
    assignedEmployees.map((employee) => [employee.membership_id, employee.profile])
  );
  const orderedAssignedEmployees = assignedMembershipIds.map((membershipId) =>
    assignedEmployeesByMembershipId.get(membershipId)
  );
  const customer = job.customer_id ? await getCustomerById(job.customer_id) : null;
  const selectedAddress = job.customer_address_id
    ? customer?.addresses.find((address) => address.id === job.customer_address_id)
    : null;
  const primaryAddress =
    selectedAddress ??
    customer?.addresses.find((address) => address.is_primary) ??
    customer?.addresses[0];
  const statusEvents = await listOrderStatusEventsWithActors(job.id);

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
  const statusDotStyles: Record<string, string> = {
    scheduled: "bg-blue-500",
    in_progress: "bg-amber-500",
    done: "bg-emerald-500",
    canceled: "bg-rose-500"
  };
  const statusDot = statusDotStyles[job.status] ?? "bg-slate-400";
  const historyItems = [
    ...statusEvents.map((event) => ({
      ...event,
      actor_name: event.actor_name ?? null,
      actor_email: event.actor_email ?? null
    })),
    {
      id: `created-${job.id}`,
      changed_at: job.created_at,
      old_status: null,
      new_status: job.status,
      changed_by: null,
      actor_name: null,
      actor_email: null,
      type: "created" as const
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {job.title ?? t("table.titleFallback")}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4 text-slate-400" />
            <span>
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
            </span>
          </div>
        </div>
        {isCollaborator ? null : (
          <Link href={`/jobs/${job.id}/edit`}>
            <Button className="inline-flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {t("detail.edit")}
            </Button>
          </Link>
        )}
      </header>

      <Section
        title={
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <span>{t("detail.summary.title")}</span>
          </div>
        }
        description={t("detail.summary.subtitle")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">
              {tCommon("labels.status")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
              <StatusBadge status={job.status} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">
              {t("detail.summary.scheduled")}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span>{formatDateTime(job.scheduled_for)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">
              {expectedHasTime
                ? t("detail.summary.expectedCompletion")
                : t("detail.summary.expectedCompletionDateOnly")}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>
                {job.estimated_end_at
                  ? expectedHasTime
                    ? formatDateTime(job.estimated_end_at)
                    : formatDateOnly(job.estimated_end_at)
                  : t("detail.summary.notDefined")}
              </span>
            </div>
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

      <Section
        title={
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span>{t("detail.customer.title")}</span>
          </div>
        }
        description={t("detail.customer.subtitle")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.customer.fields.name")}
            </p>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span>{job.customer_name ?? t("detail.customerFallback")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{customer?.email ?? t("detail.customer.fields.emailFallback")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{customer?.phone ?? t("detail.customer.fields.phoneFallback")}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs uppercase text-slate-400">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{t("detail.customer.fields.address")}</span>
              </div>
              <OpenInMapsButton
                address={primaryAddress ?? null}
                label="Direções"
                className="rounded-xl"
              />
            </div>
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
        title={
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{t("detail.team.title")}</span>
          </div>
        }
        description={t("detail.team.subtitle")}
      >
        <p className="text-xs text-slate-500">{t("detail.team.manageHint")}</p>
        {orderedAssignedEmployees.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-6 text-center text-sm text-slate-500">
            <Users className="h-5 w-5 text-slate-300" />
            <p>{t("detail.team.empty")}</p>
            <p className="text-xs text-slate-400">{t("detail.team.manageHint")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderedAssignedEmployees.map((employee, index) => {
              const label = employee?.full_name?.trim() || t("detail.team.unknown");
              const initial = label.charAt(0).toUpperCase();
              return (
                <div
                  key={employee?.id ?? `missing-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-slate-100 text-sm font-semibold text-slate-600">
                      {initial}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {employee?.full_name ?? t("detail.team.unknown")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {employee?.email ?? t("detail.team.unknownEmail")}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {t("detail.team.assignedLabel")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {(() => {
        const notes = [
          { label: t("detail.notes.jobLabel"), value: job.notes },
          { label: t("detail.notes.customerLabel"), value: customer?.notes },
          { label: t("detail.notes.addressLabel"), value: primaryAddress?.note }
        ]
          .map((item) => ({ ...item, value: item.value?.trim() ?? "" }))
          .filter((item) => item.value.length > 0);

        return (
          <Section title={
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-slate-400" />
              <span>{t("detail.notes.title")}</span>
            </div>
          } description={t("detail.notes.subtitle")}>
            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-4 text-sm text-slate-500">
                {t("detail.notes.subtitle")}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {notes.map((note) => (
                  <div
                    key={note.label}
                    className="rounded-xl border border-slate-200/70 bg-white/90 p-4 text-sm text-slate-700"
                  >
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      {note.label}
                    </p>
                    <p className="mt-2 whitespace-pre-line">{note.value}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        );
      })()}

      <div id="history" className="border-t border-slate-200/70 pt-6 mt-6">
        <Section
          title={
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-slate-400" />
              <span>{t("detail.history.title")}</span>
            </div>
          }
          description={t("detail.history.subtitle")}
        >
          <OrderHistoryTimeline
            events={historyItems}
            locale={locale}
          />
        </Section>
      </div>
    </div>
  );
}
