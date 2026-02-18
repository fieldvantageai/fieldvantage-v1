"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Users } from "lucide-react";

import { useClientT } from "@/lib/i18n/useClientT";
import { Section } from "@/components/ui/Section";

type AttentionItem = {
  id: string;
  label: string;
  customer: string;
  href: string;
};

type AttentionCategory = {
  key: "overdue" | "unassigned" | "shouldStart";
  items: AttentionItem[];
};

type NeedsAttentionSectionProps = {
  totalCount: number;
  categories: AttentionCategory[];
};

const MAX_VISIBLE = 3;

const iconByKey = {
  overdue: AlertTriangle,
  unassigned: Users,
  shouldStart: Clock
} as const;

export default function NeedsAttentionSection({
  totalCount,
  categories
}: NeedsAttentionSectionProps) {
  const { t } = useClientT("dashboard");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (totalCount === 0) {
    return null;
  }

  return (
    <Section
      title={`${t("attention.title")} (${totalCount})`}
      description={t("attention.subtitle")}
    >
      <div className="space-y-4 text-sm text-slate-700">
        {categories.map((category) => {
          if (category.items.length === 0) {
            return null;
          }
          const isExpanded = Boolean(expanded[category.key]);
          const visibleItems = isExpanded
            ? category.items
            : category.items.slice(0, MAX_VISIBLE);
          const remaining = category.items.length - MAX_VISIBLE;
          const Icon = iconByKey[category.key];

          return (
            <div key={category.key} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Icon className="h-4 w-4" />
                {t(`attention.${category.key}`)}
              </div>
              {visibleItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-amber-100/80 bg-amber-50/60 px-4 py-3 transition hover:border-amber-200 hover:bg-amber-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500">{item.customer}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-700">
                    {t(`attention.${category.key}`)}
                  </span>
                </Link>
              ))}
              {category.items.length > MAX_VISIBLE ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [category.key]: !isExpanded
                    }))
                  }
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  {isExpanded
                    ? t("attention.viewLess")
                    : t("attention.viewMore").replace("{count}", String(remaining))}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
