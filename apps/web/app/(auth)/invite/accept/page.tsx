import InviteAcceptForm from "@/components/invites/InviteAcceptForm";
import { Section } from "@/components/ui/Section";
import { validateInviteToken } from "@/features/invites/validateInvite";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InviteAcceptPage({ searchParams }: PageProps) {
  const locale = await getServerLocale();
  const t = await getT(locale, "invites");
  const params = searchParams ? await searchParams : undefined;
  const tokenValue = params?.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;

  if (!token) {
    return (
      <Section
        title={t("page.invalidTitle")}
        description={t("page.invalidDescription")}
      >
        <p className="text-sm text-slate-600">{t("page.invalidHint")}</p>
      </Section>
    );
  }

  // Call the shared server function directly — no self-HTTP-fetch needed
  const result = await validateInviteToken(token);

  if (!result.ok) {
    const message =
      result.status === 410
        ? t("page.errors.expired")
        : result.status === 409
          ? t("page.errors.accepted")
          : result.status === 404
            ? t("page.errors.notFound")
            : t("page.errors.invalid");

    return (
      <Section title={t("page.errorTitle")} description={message}>
        <p className="text-sm text-slate-600">{t("page.invalidHint")}</p>
      </Section>
    );
  }

  const formatTemplate = (template: string, values: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

  const companyName = result.company.name || t("page.companyFallback");
  const logoUrl =
    result.company.logo_signed_url ??
    (result.company.logo_url?.startsWith("http")
      ? result.company.logo_url
      : null);

  return (
    <div className="space-y-6">
      <Section
        title={formatTemplate(t("page.title"), { company: companyName })}
        description={t("page.subtitle")}
      >
        <div className="flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="h-16 w-16 rounded-full border border-slate-200/70 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200/70 bg-white text-base font-semibold text-slate-600 shadow-sm">
              {companyName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <InviteAcceptForm
          token={token}
          email={result.employee.email ?? null}
          expiresAt={result.invite.expires_at}
        />
      </Section>
    </div>
  );
}
