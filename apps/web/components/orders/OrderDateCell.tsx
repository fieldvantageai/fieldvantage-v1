"use client";

import { Calendar, Clock } from "lucide-react";

type OrderDateCellProps = {
  value: string;
  locale: string;
  className?: string;
};

export default function OrderDateCell({
  value,
  locale,
  className
}: OrderDateCellProps) {
  const date = new Date(value);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className={`text-sm text-slate-600 ${className ?? ""}`}>
      <div className="flex items-center gap-x-2">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span>{dateFormatter.format(date)}</span>
      </div>
      <div className="mt-1 flex items-center gap-x-2 text-xs text-slate-400">
        <Clock className="h-4 w-4 text-amber-500" />
        <span>{timeFormatter.format(date)}</span>
      </div>
    </div>
  );
}
