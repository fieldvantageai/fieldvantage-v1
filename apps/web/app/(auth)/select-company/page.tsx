"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useClientT } from "@/lib/i18n/useClientT";

type MyCompany = {
  company_id: string;
  company_name: string;
  role: "owner" | "admin" | "member";
};

export default function SelectCompanyPage() {
  const router = useRouter();
  const { t } = useClientT("companies");
  const [companies, setCompanies] = useState<MyCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCompanies = async () => {
      try {
        const response = await fetch("/api/me/companies", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(t("selectCompany.loadError"));
        }
        const payload = (await response.json()) as { data?: MyCompany[] };
        if (isMounted) {
          setCompanies(payload.data ?? []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : t("selectCompany.loadError"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const handleSelect = async (companyId: string) => {
    const response = await fetch("/api/me/active-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId })
    });
    if (response.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(t("selectCompany.selectError"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t("selectCompany.title")}
        </h1>
        <p className="text-sm text-slate-500">{t("selectCompany.subtitle")}</p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-sm text-slate-500">
          {t("selectCompany.loading")}
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-sm text-slate-500">
          {t("selectCompany.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <div
              key={company.company_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {company.company_name}
                </p>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {t(`selectCompany.roles.${company.role}`)}
                </span>
              </div>
              <Button type="button" onClick={() => handleSelect(company.company_id)}>
                {t("selectCompany.access")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
