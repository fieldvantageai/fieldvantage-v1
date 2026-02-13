"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import type { Customer } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type CustomersListClientProps = {
  customers: Customer[];
};

export default function CustomersListClient({ customers }: CustomersListClientProps) {
  const { t } = useClientT("customers");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const canFilter = normalized.length >= 3;

  const visibleCustomers = useMemo(() => {
    if (!canFilter) {
      return customers;
    }
    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() ?? "";
      const email = customer.email?.toLowerCase() ?? "";
      const phone = customer.phone?.toLowerCase() ?? "";
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        phone.includes(normalized)
      );
    });
  }, [canFilter, customers, normalized]);

  if (customers.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.subtitle")}
        actionLabel={t("empty.cta")}
        actionClassName="border border-slate-300/80 bg-slate-50/95 hover:bg-slate-100/80"
        illustration={
          <div className="-mb-1">
            <svg
              width="96"
              height="64"
              viewBox="0 0 96 64"
              aria-hidden="true"
              className="text-slate-300"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 28h76" />
                <path d="M18 28V54h60V28" />
                <path d="M24 54V38h20v16" />
                <path d="M56 40h14v14H56z" />
                <path d="M18 28l6-14h48l6 14" />
                <path d="M34 14v-6h28v6" />
              </g>
            </svg>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Section title={t("search.title")} description={t("search.description")}>
        <div className="space-y-2">
          <Input
            label={t("search.label")}
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query.trim().length > 0 && !canFilter ? (
            <p className="text-xs text-slate-500">{t("search.minChars")}</p>
          ) : null}
        </div>
      </Section>

      <Section title={t("list.title")} description={t("list.description")}>
        {canFilter && visibleCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-4 text-sm text-slate-500">
            {t("search.noResults")}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <Link href={`/customers/${customer.id}`} className="flex-1">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {customer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {customer.email ?? "-"} • {customer.phone ?? "-"}
                    </p>
                  </div>
                </Link>
                <Link
                  href={{
                    pathname: "/jobs/new",
                    query: {
                      customerId: customer.id,
                      customerName: customer.name
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-600 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  aria-label={t("actions.newJob")}
                  title={t("actions.newJob")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
