import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

import NewCustomerForm from "@/components/forms/NewCustomerForm";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

export default async function NewCustomerPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "customers");

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <Link
            href="/customers"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("list.title")}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-300/40">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t("new.title")}</h1>
              <p className="text-sm text-slate-500">{t("new.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <NewCustomerForm />
      </div>
    </div>
  );
}
