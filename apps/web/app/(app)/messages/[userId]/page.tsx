import { Section } from "@/components/ui/Section";
import MessageThreadClient from "@/components/messages/MessageThreadClient";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function MessageThreadPage({ params }: PageProps) {
  const { userId } = await params;
  const locale = await getServerLocale();
  const t = await getT(locale, "messages");

  return (
    <div className="space-y-6">
      <Section title={t("thread.title")} description="">
        <MessageThreadClient userId={userId} />
      </Section>
    </div>
  );
}
