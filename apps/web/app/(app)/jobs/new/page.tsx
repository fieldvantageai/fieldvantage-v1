import { ArrowLeft, ClipboardPlus } from "lucide-react";
import Link from "next/link";

import NewJobForm from "@/components/forms/NewJobForm";
import { Badge } from "@/components/ui/Badge";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";
import type { JobStatus } from "@fieldvantage/shared";

export default async function NewJobPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const status: JobStatus = "scheduled";
  const scheduledClass = "bg-blue-50 text-blue-700";

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <Link
            href="/jobs"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("title")}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-300/40">
              <ClipboardPlus className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{t("new.title")}</h1>
                <Badge
                  variant="default"
                  className={`transition-all duration-200 ${scheduledClass}`}
                >
                  {t(`status.${status}`)}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{t("new.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-36 md:pb-24">
        <NewJobForm />
      </div>
    </div>
  );
}
