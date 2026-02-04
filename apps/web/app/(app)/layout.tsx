import { redirect } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/entrar");
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    redirect("/select-company");
  }

  return <AppShell>{children}</AppShell>;
}
