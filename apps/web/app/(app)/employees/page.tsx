import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { listEmployees } from "@/features/employees/mock";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function EmployeesPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "employees");
  const tCommon = await getT(locale, "common");
  const employees = await listEmployees();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/employees/new">
          <Button>{t("actions.new")}</Button>
        </Link>
      </header>
      {employees.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.subtitle")}
          actionLabel={t("actions.new")}
        />
      ) : (
        <Section title={t("list.title")} description={t("list.description")}>
          <div className="space-y-3">
            {employees.map((employee) => (
              <Link
                key={employee.id}
                href={`/employees/${employee.id}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {employee.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {employee.email} • {getEmployeeRoleLabel(employee.role)}
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
        </Section>
      )}
    </div>
  );
}
