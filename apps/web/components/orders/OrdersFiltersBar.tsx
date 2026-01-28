"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useClientT } from "@/lib/i18n/useClientT";
import type { JobStatus } from "@fieldvantage/shared";

export type OrdersFilters = {
  query: string;
  status: "all" | JobStatus;
  fromDate?: Date | null;
  toDate?: Date | null;
};

type OrdersFiltersBarProps = {
  filters: OrdersFilters;
  onChange: (next: OrdersFilters) => void;
  onClear: () => void;
  locale: string;
};

export default function OrdersFiltersBar({
  filters,
  onChange,
  onClear,
  locale
}: OrdersFiltersBarProps) {
  const { t } = useClientT("jobs");
  const formatDate = (date?: Date | null) =>
    date ? new Intl.DateTimeFormat(locale).format(date) : "";

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.6fr)]">
        <Input
          label={t("filters.searchLabel")}
          placeholder={t("filters.searchPlaceholder")}
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
        />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-full w-full flex-col items-start justify-center rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2.5 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <span className="text-xs font-medium text-slate-500">
                {t("filters.fromLabel")}
              </span>
              <span className="text-sm text-slate-700">
                {filters.fromDate ? formatDate(filters.fromDate) : t("filters.any")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-2">
            <Calendar
              mode="single"
              selected={filters.fromDate ?? undefined}
              onSelect={(date) => onChange({ ...filters, fromDate: date })}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-full w-full flex-col items-start justify-center rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2.5 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <span className="text-xs font-medium text-slate-500">
                {t("filters.toLabel")}
              </span>
              <span className="text-sm text-slate-700">
                {filters.toDate ? formatDate(filters.toDate) : t("filters.any")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-2">
            <Calendar
              mode="single"
              selected={filters.toDate ?? undefined}
              onSelect={(date) => onChange({ ...filters, toDate: date })}
            />
          </PopoverContent>
        </Popover>

        <Select
          label={t("filters.statusLabel")}
          value={filters.status}
          options={[
            { value: "all", label: t("filters.statusAll") },
            { value: "scheduled", label: t("status.scheduled") },
            { value: "in_progress", label: t("status.in_progress") },
            { value: "done", label: t("status.done") },
            { value: "canceled", label: t("status.canceled") }
          ]}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as OrdersFilters["status"] })
          }
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">{t("filters.helper")}</span>
        <Button type="button" variant="ghost" onClick={onClear}>
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
}
