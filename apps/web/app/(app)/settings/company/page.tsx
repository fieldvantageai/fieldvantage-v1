import CompanyProfileForm from "@/components/forms/CompanyProfileForm";
import { Section } from "@/components/ui/Section";
import { getMyCompany } from "@/features/companies/service";
import { getServerLocale } from "@/lib/i18n/localeServer";
import { getT } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CompanyProfilePage() {
  const locale = await getServerLocale();
  const t = await getT(locale, "companies");
  const company = await getMyCompany();

  let logoPreviewUrl: string | null = null;
  if (company?.logo_url) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(company.logo_url, 60 * 60);
    logoPreviewUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="max-w-3xl">
      <Section title={t("title")} description={t("subtitle")}>
        <CompanyProfileForm company={company} logoPreviewUrl={logoPreviewUrl} />
      </Section>
    </div>
  );
}
