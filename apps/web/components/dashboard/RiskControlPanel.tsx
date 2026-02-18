"use client";

import { useState } from "react";
import Link from "next/link";

import { useClientT } from "@/lib/i18n/useClientT";

type RiskItem = {
  id: string;
  title: string;
  customer: string;
  href: string;
};

type RiskCategory = {
  key: "overdue" | "shouldStart" | "unassigned";
  title: string;
  count: number;
  items: RiskItem[];
};

type RiskControlPanelProps = {
  categories: RiskCategory[];
};

const MAX_VISIBLE = 3;

export default function RiskControlPanel({ categories }: RiskControlPanelProps) {
  const { t } = useClientT("dashboard");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => {
        const isExpanded = Boolean(expanded[category.key]);
        const visibleItems = isExpanded
          ? category.items
          : category.items.slice(0, MAX_VISIBLE);
        const remaining = Math.max(category.items.length - MAX_VISIBLE, 0);

        return (
          <div
            key={category.key}
            className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {category.title}
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {category.count}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {visibleItems.length === 0 ? (
                <p className="text-xs text-slate-500">{t("risk.emptyGroup")}</p>
              ) : (
                visibleItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-amber-100/80 bg-amber-50/60 px-4 py-3 transition hover:border-amber-200 hover:bg-amber-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">{item.customer}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700">
                      {category.title}
                    </span>
                  </Link>
                ))
              )}
            </div>
            {category.items.length > MAX_VISIBLE ? (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [category.key]: !isExpanded
                  }))
                }
                className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {isExpanded
                  ? t("risk.viewLess")
                  : `${t("risk.viewMoreLabel")} (${remaining})`}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
