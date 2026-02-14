import { notFound } from "next/navigation";

import EditJobForm from "@/components/forms/EditJobForm";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { getJobById } from "@/features/jobs/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditJobPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  const variant =
    job.status === "done"
      ? "success"
      : job.status === "in_progress"
        ? "warning"
        : job.status === "canceled"
          ? "danger"
          : "default";
  const scheduledClass =
    job.status === "scheduled" ? "bg-blue-50 text-blue-700" : "";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Section
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>{t("edit.title")}</span>
            <Badge
              variant={variant}
              className={`transition-all duration-200 ${scheduledClass}`}
            >
              {t(`status.${job.status}`)}
            </Badge>
          </div>
        }
        description={t("edit.subtitle")}
        className="pb-3"
      >
        <EditJobForm job={job} />
      </Section>
    </div>
  );
}
