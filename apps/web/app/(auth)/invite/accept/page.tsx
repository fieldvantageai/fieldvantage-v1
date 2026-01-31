import { headers } from "next/headers";

import InviteAcceptForm from "@/components/invites/InviteAcceptForm";
import { Section } from "@/components/ui/Section";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const getBaseUrl = async () => {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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

  const baseUrl = await getBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/invites/validate?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const message =
      response.status === 410
        ? t("page.errors.expired")
        : response.status === 409
          ? t("page.errors.accepted")
          : response.status === 404
            ? t("page.errors.notFound")
            : t("page.errors.invalid");
    return (
      <Section title={t("page.errorTitle")} description={message}>
        <p className="text-sm text-slate-600">{t("page.invalidHint")}</p>
      </Section>
    );
  }

  const payload = (await response.json()) as {
    company: {
      id: string;
      name: string;
      logo_url?: string | null;
      logo_signed_url?: string | null;
    };
    employee: { id: string; first_name: string; last_name: string; email: string | null };
    invite: { id: string; expires_at: string };
  };

  const formatTemplate = (template: string, values: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  const companyName = payload.company?.name ?? t("page.companyFallback");
  const logoUrl =
    payload.company?.logo_signed_url ??
    (payload.company?.logo_url?.startsWith("http")
      ? payload.company.logo_url
      : null);

  return (
    <div className="space-y-6">
      <Section
        title={formatTemplate(t("page.title"), {
          company: companyName
        })}
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
          email={payload.employee?.email ?? null}
          expiresAt={payload.invite.expires_at}
        />
      </Section>
    </div>
  );
}
