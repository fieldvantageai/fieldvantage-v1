import NewJobForm from "@/components/forms/NewJobForm";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";
import type { JobStatus } from "@fieldvantage/shared";

export default async function NewJobPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const status: JobStatus = "scheduled";
  const variant = "default";
  const scheduledClass = "bg-blue-50 text-blue-700";
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Section
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>{t("new.title")}</span>
            <Badge
              variant={variant}
              className={`transition-all duration-200 ${scheduledClass}`}
            >
              {t(`status.${status}`)}
            </Badge>
          </div>
        }
        description={t("new.subtitle")}
        className="pb-3"
      >
        <NewJobForm />
      </Section>
    </div>
  );
}
