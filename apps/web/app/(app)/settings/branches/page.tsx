import { redirect } from "next/navigation";

import { Section } from "@/components/ui/Section";
import BranchesManager from "@/components/branches/BranchesManager";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";

export const metadata = { title: "Filiais" };

export default async function BranchesPage() {
  const context = await getActiveCompanyContext();

  if (!context || context.role === "member") {
    redirect("/settings");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-[var(--text)] sm:text-3xl">
          Filiais
        </h1>
        <p className="text-sm text-slate-500 dark:text-[var(--text-muted)]">
          Organize sua empresa em unidades (filiais). Membros sem filial têm acesso a toda a
          empresa.
        </p>
      </header>

      <Section
        title="Gerenciar filiais"
        description="Adicione, edite ou remova as filiais da sua empresa."
      >
        <BranchesManager />
      </Section>
    </div>
  );
}
