import Link from "next/link";

import { Button } from "@/components/ui/Button";
import OrdersListClient from "@/components/orders/OrdersListClient";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function JobsPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "jobs");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/jobs/new">
          <Button className="hidden sm:inline-flex">{t("actions.new")}</Button>
        </Link>
      </header>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {t("list.allTitle")}
          </h2>
          <p className="text-sm text-slate-500">{t("list.allDescription")}</p>
        </div>
        <OrdersListClient locale={locale} />
      </div>
    </div>
  );
}
