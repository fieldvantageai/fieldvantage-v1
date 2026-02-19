import { ArrowLeft, UserCog } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import EditEmployeeForm from "@/components/forms/EditEmployeeForm";
import { getEmployeeById } from "@/features/employees/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "employees");
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const displayName =
    [employee.first_name, employee.last_name].filter(Boolean).join(" ") ||
    employee.full_name ||
    "Colaborador";

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <Link
            href={`/employees/${id}`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {displayName || t("title")}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-300/40">
              <UserCog className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t("edit.title")}</h1>
              <p className="text-sm text-slate-500">{t("edit.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <EditEmployeeForm employee={employee} />
      </div>
    </div>
  );
}
