import { Section } from "@/components/ui/Section";
import RegisterCompanyForm from "@/components/forms/RegisterCompanyForm";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function RegisterCompanyPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "auth");

  return (
    <div className="max-w-xl">
      <Section title={t("register.title")} description={t("register.subtitle")}>
        <RegisterCompanyForm />
      </Section>
    </div>
  );
}
