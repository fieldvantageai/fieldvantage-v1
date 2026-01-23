import { notFound } from "next/navigation";

import EditEmployeeForm from "@/components/forms/EditEmployeeForm";
import { Section } from "@/components/ui/Section";
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

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Section
        title={t("edit.title")}
        description={t("edit.subtitle")}
      >
        <EditEmployeeForm employee={employee} />
      </Section>
    </div>
  );
}
