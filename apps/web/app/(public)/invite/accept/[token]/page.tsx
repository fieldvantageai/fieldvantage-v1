import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

type PageProps = {
  params: Promise<{ token: string }> | { token: string };
};

export default async function AcceptInvitePage({ params }: PageProps) {
  const locale = await getServerLocale();
  const t = await getT(locale, "auth");
  const { token } = await params;

  return (
    <div className="max-w-xl">
      <Section
        title={t("invite.title")}
        description={t("invite.subtitle")}
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {t("invite.tokenLabel")}: <span className="font-mono">{token}</span>
        </div>
        <Button className="w-full">{t("invite.actions.accept")}</Button>
      </Section>
    </div>
  );
}
