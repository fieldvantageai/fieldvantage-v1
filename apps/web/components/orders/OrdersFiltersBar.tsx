"use client";

import { Calendar, Search, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Calendar as CalendarPicker } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useClientT } from "@/lib/i18n/useClientT";
import type { JobStatus } from "@fieldvantage/shared";

export type OrdersFilters = {
  query: string;
  status: "all" | JobStatus;
  fromDate?: Date | null;
  toDate?: Date | null;
  unassigned?: boolean;
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
    <div>
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-6 lg:grid-cols-12">
        <div className="sm:col-span-6 lg:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {t("filters.searchLabel")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              value={filters.query}
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-slate-200/70 bg-white/90 px-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div className="sm:col-span-3 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {t("filters.fromLabel")}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200/70 bg-white/90 px-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-slate-700">
                  {filters.fromDate
                    ? formatDate(filters.fromDate)
                    : t("filters.fromPlaceholder")}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <CalendarPicker
                mode="single"
                selected={filters.fromDate ?? undefined}
                onSelect={(date) => onChange({ ...filters, fromDate: date })}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="sm:col-span-3 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {t("filters.toLabel")}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200/70 bg-white/90 px-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-slate-700">
                  {filters.toDate
                    ? formatDate(filters.toDate)
                    : t("filters.toPlaceholder")}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <CalendarPicker
                mode="single"
                selected={filters.toDate ?? undefined}
                onSelect={(date) => onChange({ ...filters, toDate: date })}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="sm:col-span-3 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {t("filters.statusLabel")}
          </label>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as OrdersFilters["status"] })
            }
            className="h-11 w-full rounded-xl border border-slate-200/70 bg-white/90 px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">{t("filters.statusAll")}</option>
            <option value="scheduled">{t("status.scheduled")}</option>
            <option value="in_progress">{t("status.in_progress")}</option>
            <option value="done">{t("status.done")}</option>
            <option value="canceled">{t("status.canceled")}</option>
          </select>
        </div>

        <div className="flex justify-end sm:col-span-3 lg:col-span-2">
          <Button
            type="button"
            variant="ghost"
            className="flex h-11 items-center px-3"
            onClick={onClear}
          >
            <X className="mr-2 h-4 w-4 text-slate-400" />
            {t("filters.clear")}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{t("filters.helper")}</p>
    </div>
  );
}
