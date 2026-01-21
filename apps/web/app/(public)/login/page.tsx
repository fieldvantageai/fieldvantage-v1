import { Section } from "@/components/ui/Section";
import LoginForm from "@/components/forms/LoginForm";
import { getT } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/localeServer";

export default async function LoginPage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "auth");

  return (
    <div className="max-w-lg">
      <Section title={t("login.title")} description={t("login.subtitle")}>
        <LoginForm />
      </Section>
    </div>
  );
}
