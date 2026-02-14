"use client";

import { Check, Plus, RefreshCcw, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useClientT } from "@/lib/i18n/useClientT";

type HistoryEvent = {
  id: string;
  changed_at: string;
  old_status: string | null;
  new_status: string | null;
  actor_name: string | null;
  actor_email: string | null;
  note?: string | null;
} & (
  | { type: "created" }
  | { type?: never }
);

type OrderHistoryTimelineProps = {
  events: HistoryEvent[];
  locale: string;
};

export default function OrderHistoryTimeline({
  events,
  locale
}: OrderHistoryTimelineProps) {
  const { t } = useClientT("jobs");
  const [expanded, setExpanded] = useState(false);
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
    [locale]
  );
  const formatDateTime = (value: string) => dateTimeFormatter.format(new Date(value));
  const formatTemplate = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
  const visibleEvents = useMemo(
    () => (expanded ? events : events.slice(0, 3)),
    [events, expanded]
  );

  return (
    <div className="space-y-4 transition-all duration-300">
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">{t("detail.history.emptyStatus")}</p>
      ) : null}
      {visibleEvents.map((event, index) => {
        const isCreated = "type" in event && event.type === "created";
        const newStatusLabel = event.new_status
          ? t(`status.${event.new_status}`)
          : t("detail.history.statusFallback");
        const oldStatusLabel = event.old_status
          ? t(`status.${event.old_status}`)
          : null;
        const actorLabel =
          event.actor_name || event.actor_email || t("detail.history.userFallback");
        const note =
          "note" in event && typeof event.note === "string"
            ? event.note.trim()
            : null;
        const isCanceled = event.new_status === "canceled";
        const isDone = event.new_status === "done";
        const dotColor = isCanceled
          ? "bg-rose-500"
          : isDone
            ? "bg-emerald-500"
            : isCreated
              ? "bg-emerald-400"
              : "bg-blue-500";
        const Icon = isCanceled
          ? X
          : isDone
            ? Check
            : isCreated
              ? Plus
              : RefreshCcw;
        return (
          <div key={event.id} className="relative flex gap-4">
            <div className="relative flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${dotColor} text-white`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {index < visibleEvents.length - 1 ? (
                <span className="mt-2 h-full w-px bg-slate-200" />
              ) : null}
            </div>
            <div className="flex-1 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 transition hover:bg-slate-50/60">
              <p className="text-sm font-semibold text-slate-900">
                {isCreated
                  ? t("detail.history.createdLabel")
                  : t("detail.history.statusChangedLabel")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {isCreated
                  ? newStatusLabel
                  : oldStatusLabel
                    ? formatTemplate(t("detail.history.fromTo"), {
                        from: oldStatusLabel,
                        to: newStatusLabel
                      })
                    : newStatusLabel}
              </p>
              {note ? (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">
                    {t("detail.history.noteLabel")}:
                  </span>{" "}
                  {note}
                </p>
              ) : null}
              <div className="mt-2 text-xs text-slate-400">
                {actorLabel} · {formatDateTime(event.changed_at)}
              </div>
            </div>
          </div>
        );
      })}
      {events.length > 3 ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-4 text-sm font-medium text-brand-600 transition hover:underline"
          >
            {expanded ? t("detail.history.showLess") : t("detail.history.showAll")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
