import { ArrowLeft, ClipboardEdit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import EditJobForm from "@/components/forms/EditJobForm";
import { Badge } from "@/components/ui/Badge";
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

  const displayTitle = job.title ?? t("table.titleFallback");

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <Link
            href={`/jobs/${id}`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {displayTitle}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-300/40">
              <ClipboardEdit className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{t("edit.title")}</h1>
                <Badge
                  variant={variant}
                  className={`transition-all duration-200 ${scheduledClass}`}
                >
                  {t(`status.${job.status}`)}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{t("edit.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-36 md:pb-24">
        <EditJobForm job={job} />
      </div>
    </div>
  );
}
