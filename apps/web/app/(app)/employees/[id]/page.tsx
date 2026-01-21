import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getEmployeeById } from "@/features/employees/mock";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "employees");
  const tCommon = await getT(locale, "common");
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {employee.full_name}
          </h1>
          <p className="text-sm text-slate-500">
            {getEmployeeRoleLabel(employee.role)}
          </p>
        </div>
        <Link href={`/employees/${employee.id}/edit`}>
          <Button>{t("detail.edit")}</Button>
        </Link>
      </header>

      <Section title={t("detail.summary.title")} description={t("detail.summary.subtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {t("detail.summary.contact")}
            </p>
            <p className="mt-2 text-sm text-slate-700">{employee.email}</p>
            <p className="text-sm text-slate-700">
              {employee.phone ?? t("detail.summary.phoneFallback")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-400">
              {tCommon("labels.status")}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {employee.status === "active"
                ? tCommon("status.active")
                : tCommon("status.inactive")}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
