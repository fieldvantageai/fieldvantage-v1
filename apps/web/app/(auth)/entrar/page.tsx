import LoginForm from "@/components/forms/LoginForm";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function LoginPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "auth");

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface)]">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-brand-600 transition hover:bg-slate-50/70 dark:border-[var(--border)] dark:text-brand-400 dark:hover:bg-[var(--surface2)]"
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
          <div className="flex items-center gap-2">
            {/* Light logo (hidden in dark mode) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-light.svg"
              alt="Geklix"
              width={100}
              height={28}
              className="block h-7 w-auto object-contain dark:hidden"
            />
            {/* Dark logo (shown in dark mode) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-dark.svg"
              alt="Geklix"
              width={100}
              height={28}
              className="hidden h-7 w-auto object-contain dark:block"
            />
          </div>
          {/* Spacer to keep logo centred */}
          <div className="h-10 w-10" aria-hidden="true" />
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface)]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-[var(--text)]">
          {t("login.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-[var(--text-muted)]">
          {t("login.subtitle")}
        </p>
        <div className="mt-5">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
