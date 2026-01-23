import NewJobForm from "@/components/forms/NewJobForm";
import { Section } from "@/components/ui/Section";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function NewJobPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Section
        title={t("new.title")}
        description={t("new.subtitle")}
      >
        <NewJobForm />
      </Section>
    </div>
  );
}
