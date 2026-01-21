import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { listJobs } from "@/features/jobs/mock";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function JobsPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");
  const jobs = await listJobs();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/jobs/new">
          <Button>{t("actions.new")}</Button>
        </Link>
      </header>
      {jobs.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.subtitle")}
          actionLabel={t("actions.new")}
        />
      ) : (
        <Section title={t("list.title")} description={t("list.description")}>
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {job.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {job.customer_name ?? t("detail.customerFallback")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {new Date(job.scheduled_for).toLocaleString(locale)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
