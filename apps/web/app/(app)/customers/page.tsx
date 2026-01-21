import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import { listCustomers } from "@/features/customers/mock";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function CustomersPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "customers");
  const customers = await listCustomers();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/customers/new">
          <Button>{t("new.title")}</Button>
        </Link>
      </header>

      <Section title={t("search.title")} description={t("search.description")}>
        <Input label={t("search.label")} placeholder={t("search.placeholder")} />
      </Section>

      {customers.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.subtitle")}
          actionLabel={t("new.title")}
        />
      ) : (
        <Section title={t("list.title")} description={t("list.description")}>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <Link href={`/customers/${customer.id}`} className="flex-1">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {customer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {customer.email} • {customer.phone}
                    </p>
                  </div>
                </Link>
                <Link
                  href={{
                    pathname: "/jobs/new",
                    query: {
                      customerId: customer.id,
                      customerName: customer.name
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  aria-label={t("actions.newJob")}
                  title={t("actions.newJob")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
