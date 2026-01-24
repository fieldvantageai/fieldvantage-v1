import { Section } from "@/components/ui/Section";
import LoginForm from "@/components/forms/LoginForm";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function LoginPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "auth");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-brand-600 transition hover:bg-slate-50/70"
            aria-label="Voltar"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </a>
          <p className="text-sm font-semibold text-slate-900">FieldVantage</p>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>
      </div>
      <Section title={t("login.title")} description={t("login.subtitle")}>
        <LoginForm />
      </Section>
    </div>
  );
}
