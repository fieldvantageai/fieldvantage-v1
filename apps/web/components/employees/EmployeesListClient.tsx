"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import type { Employee } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type EmployeesListClientProps = {
  employees: Employee[];
};

export default function EmployeesListClient({ employees }: EmployeesListClientProps) {
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const canFilter = normalized.length >= 3;

  const visibleEmployees = useMemo(() => {
    if (!canFilter) {
      return employees;
    }
    return employees.filter((employee) => {
      const name = employee.full_name?.toLowerCase() ?? "";
      const email = employee.email?.toLowerCase() ?? "";
      const role = getEmployeeRoleLabel(employee.role).toLowerCase();
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        role.includes(normalized)
      );
    });
  }, [canFilter, employees, normalized]);

  if (employees.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.subtitle")}
        actionLabel={t("actions.new")}
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
        {canFilter && visibleEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-4 text-sm text-slate-500">
            {t("search.noResults")}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEmployees.map((employee) => (
              <Link
                key={employee.id}
                href={`/employees/${employee.id}`}
                className="block rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {employee.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {employee.email ?? "-"} • {getEmployeeRoleLabel(employee.role)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {employee.status === "active"
                      ? tCommon("status.active")
                      : tCommon("status.inactive")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
