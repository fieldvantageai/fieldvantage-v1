import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActiveCompanyRole = "owner" | "admin" | "member";

export type ActiveCompanyContext = {
  companyId: string;
  role: ActiveCompanyRole;
};

export const ACTIVE_COMPANY_COOKIE = "fv_active_company";

export async function getActiveCompanyContext(): Promise<ActiveCompanyContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value ?? null;

  const { data: memberships, error } = await supabase
    .from("company_memberships")
    .select("company_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !memberships) {
    return null;
  }

  if (memberships.length === 1) {
    const only = memberships[0];
    return {
      companyId: only.company_id,
      role: only.role as ActiveCompanyRole
    };
  }

  if (!cookieValue) {
    return null;
  }

  const active = memberships.find((membership) => membership.company_id === cookieValue);
  if (!active) {
    return null;
  }

  return {
    companyId: active.company_id,
    role: active.role as ActiveCompanyRole
  };
}

export async function getActiveCompanyId() {
  const context = await getActiveCompanyContext();
  return context?.companyId ?? null;
}
