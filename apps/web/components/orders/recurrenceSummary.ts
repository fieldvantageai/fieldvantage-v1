import type { JobRecurrence } from "@fieldvantage/shared";

type Translator = (key: string) => string;

const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatRecurrenceSummary(
  recurrence: JobRecurrence | null,
  t: Translator
) {
  if (!recurrence) {
    return t("recurrence.empty");
  }

  const every = recurrence.every ?? 1;
  const repeatLabel = t(`recurrence.repeat.${recurrence.repeat}`);

  if (recurrence.repeat === "daily") {
    return every === 1 ? repeatLabel : `${repeatLabel} · ${t("recurrence.everyShort")} ${every}`;
  }

  if (recurrence.repeat === "weekly") {
    const days = (recurrence.weeklyDays ?? [])
      .sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b))
      .map((day) => t(`recurrence.weekdays.${day}`))
      .join(", ");
    if (!days) {
      return every === 1 ? repeatLabel : `${repeatLabel} · ${t("recurrence.everyShort")} ${every}`;
    }
    return every === 1
      ? `${repeatLabel} · ${days}`
      : `${repeatLabel} · ${t("recurrence.everyShort")} ${every} · ${days}`;
  }

  if (recurrence.repeat === "monthly") {
    const occurrence = recurrence.monthlyOccurrence
      ? t(`recurrence.monthlyOccurrences.${recurrence.monthlyOccurrence}`)
      : "";
    const day = recurrence.monthlyDayOfWeek
      ? t(`recurrence.weekdays.${recurrence.monthlyDayOfWeek}`)
      : "";
    const detail = [occurrence, day].filter(Boolean).join(" ");
    if (!detail) {
      return every === 1 ? repeatLabel : `${repeatLabel} · ${t("recurrence.everyShort")} ${every}`;
    }
    return every === 1
      ? `${repeatLabel} · ${detail}`
      : `${repeatLabel} · ${t("recurrence.everyShort")} ${every} · ${detail}`;
  }

  return every === 1 ? repeatLabel : `${repeatLabel} · ${t("recurrence.everyShort")} ${every}`;
}
