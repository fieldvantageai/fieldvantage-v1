"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useClientT } from "@/lib/i18n/useClientT";
import type { JobRecurrence } from "@fieldvantage/shared";

type RecurrenceModalProps = {
  open: boolean;
  value: JobRecurrence | null;
  onCancel: () => void;
  onSave: (value: JobRecurrence) => void;
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthOccurrences = ["1st", "2nd", "3rd", "4th", "Last"];

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

export default function RecurrenceModal({
  open,
  value,
  onCancel,
  onSave
}: RecurrenceModalProps) {
  const { t } = useClientT("jobs");
  const [repeat, setRepeat] = useState<JobRecurrence["repeat"]>("daily");
  const [every, setEvery] = useState(1);
  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [monthlyOccurrence, setMonthlyOccurrence] =
    useState<JobRecurrence["monthlyOccurrence"]>("1st");
  const [monthlyDayOfWeek, setMonthlyDayOfWeek] =
    useState<JobRecurrence["monthlyDayOfWeek"]>("Mon");

  useEffect(() => {
    if (!open) {
      return;
    }
    if (value) {
      setRepeat(value.repeat);
      setEvery(value.every);
      setWeeklyDays(value.weeklyDays ?? []);
      setMonthlyOccurrence(value.monthlyOccurrence ?? "1st");
      setMonthlyDayOfWeek(value.monthlyDayOfWeek ?? "Mon");
    } else {
      setRepeat("daily");
      setEvery(1);
      setWeeklyDays([]);
      setMonthlyOccurrence("1st");
      setMonthlyDayOfWeek("Mon");
    }
  }, [open, value]);

  const canSave = useMemo(() => {
    if (repeat === "weekly") {
      return weeklyDays.length > 0;
    }
    if (repeat === "monthly") {
      return Boolean(monthlyOccurrence && monthlyDayOfWeek);
    }
    return every >= 1;
  }, [every, monthlyDayOfWeek, monthlyOccurrence, repeat, weeklyDays]);

  if (!open) {
    return null;
  }

  const repeatOptions = [
    { value: "daily", label: t("recurrence.repeat.daily") },
    { value: "weekly", label: t("recurrence.repeat.weekly") },
    { value: "monthly", label: t("recurrence.repeat.monthly") },
    { value: "yearly", label: t("recurrence.repeat.yearly") }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("recurrence.title")}
        </h3>

        <div className="mt-4 space-y-4">
          <Select
            label={t("recurrence.repeatLabel")}
            options={repeatOptions.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            value={repeat}
            onChange={(event) =>
              setRepeat(event.target.value as JobRecurrence["repeat"])
            }
          />

          <Input
            label={t("recurrence.everyLabel")}
            type="number"
            min={1}
            value={String(every)}
            placeholder={t("recurrence.everyPlaceholder")}
            onChange={(event) => setEvery(toNumber(event.target.value))}
          />

          {repeat === "weekly" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                {t("recurrence.weeklyLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => {
                  const isActive = weeklyDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setWeeklyDays((current) =>
                          isActive
                            ? current.filter((item) => item !== day)
                            : [...current, day]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        isActive
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-slate-200/70 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t(`recurrence.weekdays.${day}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {repeat === "monthly" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  {t("recurrence.monthlyOccurrenceLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {monthOccurrences.map((occurrence) => {
                    const isActive = monthlyOccurrence === occurrence.toLowerCase();
                    return (
                      <button
                        key={occurrence}
                        type="button"
                        onClick={() =>
                          setMonthlyOccurrence(
                            occurrence.toLowerCase() as JobRecurrence["monthlyOccurrence"]
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? "border-brand-200 bg-brand-50 text-brand-700"
                            : "border-slate-200/70 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t(`recurrence.monthlyOccurrences.${occurrence}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  {t("recurrence.monthlyDayLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day) => {
                    const isActive = monthlyDayOfWeek === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setMonthlyDayOfWeek(day as JobRecurrence["monthlyDayOfWeek"])
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? "border-brand-200 bg-brand-50 text-brand-700"
                            : "border-slate-200/70 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t(`recurrence.weekdays.${day}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("recurrence.cancel")}
          </Button>
          <Button
            type="button"
            className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300"
            onClick={() =>
              onSave({
                repeat,
                every,
                weeklyDays: repeat === "weekly" ? weeklyDays : undefined,
                monthlyOccurrence:
                  repeat === "monthly" ? monthlyOccurrence : undefined,
                monthlyDayOfWeek:
                  repeat === "monthly" ? monthlyDayOfWeek : undefined
              })
            }
            disabled={!canSave}
          >
            {t("recurrence.done")}
          </Button>
        </div>
      </div>
    </div>
  );
}
