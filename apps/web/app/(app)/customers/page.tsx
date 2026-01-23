import Link from "next/link";

import { Button } from "@/components/ui/Button";
import CustomersListClient from "@/components/customers/CustomersListClient";
import { listCustomers } from "@/features/customers/service";
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
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/customers/new">
          <Button>{t("new.title")}</Button>
        </Link>
      </header>

      <CustomersListClient customers={customers} />
    </div>
  );
}
