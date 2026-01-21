import Link from "next/link";

import { Button } from "@/components/ui/Button";
import EmployeesListClient from "@/components/employees/EmployeesListClient";
import { listEmployees } from "@/features/employees/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function EmployeesPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "employees");
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
      <EmployeesListClient employees={employees} />
    </div>
  );
}
