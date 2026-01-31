import { redirect } from "next/navigation";

import AccessBlocked from "@/components/common/AccessBlocked";
import AppShell from "@/components/layout/AppShell";
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

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, company_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !employee) {
    return <AccessBlocked variant="not_member" autoSignOut />;
  }

  if (!employee.is_active) {
    return <AccessBlocked variant="inactive" autoSignOut />;
  }

  return <AppShell>{children}</AppShell>;
}
