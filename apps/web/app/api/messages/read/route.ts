import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ success: true });
  }

  const body = (await request.json()) as { with_user_id?: string };
  const withUserId = body.with_user_id?.trim() ?? "";
  if (!withUserId) {
    return NextResponse.json({ error: "Usuario obrigatorio." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("company_id", context.companyId)
    .eq("recipient_user_id", user.id)
    .eq("sender_user_id", withUserId)
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
