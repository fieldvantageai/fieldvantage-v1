"use client";

import { Button } from "@/components/ui/Button";
import { useClientT } from "@/lib/i18n/useClientT";

type OrdersPaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function OrdersPagination({
  page,
  total,
  pageSize,
  onPrev,
  onNext
}: OrdersPaginationProps) {
  const { t } = useClientT("jobs");
  const format = (template: string, values: Record<string, number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        {format(t("pagination.showing"), { from, to, total })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrev}
          disabled={page <= 1}
        >
          {t("pagination.previous")}
        </Button>
        <span className="text-xs text-slate-400">
          {format(t("pagination.page"), { page, totalPages })}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
}
