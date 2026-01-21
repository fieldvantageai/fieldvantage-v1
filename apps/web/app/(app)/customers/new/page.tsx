import { Section } from "@/components/ui/Section";
import NewCustomerForm from "@/components/forms/NewCustomerForm";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function NewCustomerPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "customers");
  return (
    <div className="max-w-2xl">
      <Section
        title={t("new.title")}
        description={t("new.subtitle")}
      >
        <NewCustomerForm />
      </Section>
    </div>
  );
}
