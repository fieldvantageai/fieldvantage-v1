import { notFound } from "next/navigation";

import EditCustomerForm from "@/components/forms/EditCustomerForm";
import { Section } from "@/components/ui/Section";
import { getCustomerById } from "@/features/customers/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "customers");
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Section
        title={t("edit.title")}
        description={t("edit.subtitle")}
      >
        <EditCustomerForm customer={customer} />
      </Section>
    </div>
  );
}
