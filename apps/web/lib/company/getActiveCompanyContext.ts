import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActiveCompanyRole = "owner" | "admin" | "member";

export type ActiveCompanyContext = {
  companyId: string;
  role: ActiveCompanyRole;
  /** Branch primária do usuário (legado). NULL = acesso company-wide (HQ ou sem filial). */
  branchId: string | null;
  /** Todas as filiais do usuário (de membership_branches). Vazio = HQ. */
  branchIds: string[];
  /** true quando o usuário não tem restrição de filial (owner/admin HQ). */
  isHq: boolean;
};

export const ACTIVE_COMPANY_COOKIE = "fv_active_company";

type MembershipRpcRow = {
  company_id: string;
  role: string;
  status: string;
  branch_id: string | null;
  branch_ids: string[] | null;
};

function buildContext(row: MembershipRpcRow): ActiveCompanyContext {
  // membership_branches (array) é a fonte de verdade.
  // Se vazia, cai de volta para branch_id legado.
  const rawBranchIds: string[] = row.branch_ids ?? [];
  const resolvedBranchIds =
    rawBranchIds.length > 0
      ? rawBranchIds
      : row.branch_id
        ? [row.branch_id]
        : [];

  const isHq = resolvedBranchIds.length === 0;
  const branchId = resolvedBranchIds[0] ?? null;

  return {
    companyId: row.company_id,
    role: row.role as ActiveCompanyRole,
    branchId,
    branchIds: resolvedBranchIds,
    isHq
  };
}

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

  // SECURITY DEFINER RPC — evita issues de RLS/JWT em Server Components
  const { data: memberships, error } = await supabase.rpc("get_my_memberships") as {
    data: MembershipRpcRow[] | null;
    error: unknown;
  };

  if (error || !memberships) {
    return null;
  }

  if (memberships.length === 1) {
    return buildContext(memberships[0]);
  }

  if (!cookieValue) {
    return null;
  }

  const active = memberships.find((m) => m.company_id === cookieValue);
  if (!active) {
    return null;
  }

  return buildContext(active);
}

export async function getActiveCompanyId() {
  const context = await getActiveCompanyContext();
  return context?.companyId ?? null;
}
