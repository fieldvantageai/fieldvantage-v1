import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "id, company_id, user_id, full_name, email, role, is_active, avatar_url"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
  }

  // context.role comes from company_memberships (authoritative); employee.role can be stale
  const role = context.role ?? employee?.role;
  if (!employee) {
    return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
  }

  let avatarSignedUrl: string | null = null;
  if (employee.avatar_url) {
    const { data } = await supabaseAdmin.storage
      .from("customer-avatars")
      .createSignedUrl(employee.avatar_url, 60 * 60);
    avatarSignedUrl = data?.signedUrl ?? null;
  }

  return NextResponse.json({
    data: {
      ...employee,
      role,
      company_id: context.companyId,
      branch_id: context.branchId ?? null,
      branch_ids: context.branchIds,
      is_hq: context.isHq,
      avatar_signed_url: avatarSignedUrl
    }
  });
}
