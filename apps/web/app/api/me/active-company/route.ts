import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as { company_id?: string };
  const companyId = body.company_id?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ error: "Empresa invalida." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: membership, error } = await supabase
    .from("company_memberships")
    .select("company_id, status")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !membership) {
    return NextResponse.json({ error: "Sem acesso a empresa." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/"
  });

  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({ user_id: user.id, last_active_company_id: companyId })
    .eq("user_id", user.id);

  if (profileError) {
    await supabaseAdmin
      .from("user_profiles")
      .upsert({ user_id: user.id, last_active_company_id: companyId });
  }

  return NextResponse.json({ data: { company_id: companyId } });
}
