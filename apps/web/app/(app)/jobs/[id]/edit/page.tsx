import { notFound } from "next/navigation";

import EditJobForm from "@/components/forms/EditJobForm";
import { Section } from "@/components/ui/Section";
import { getJobById } from "@/features/jobs/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function EditJobPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Section
        title={t("edit.title")}
        description={t("edit.subtitle")}
      >
        <EditJobForm job={job} />
      </Section>
    </div>
  );
}
