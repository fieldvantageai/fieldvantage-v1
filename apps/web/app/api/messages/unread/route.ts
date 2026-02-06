import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ data: { count: 0 } });
  }

  const url = new URL(request.url);
  const excludeUserId = url.searchParams.get("exclude_user_id");

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("company_id", context.companyId)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);
  if (excludeUserId) {
    query = query.neq("sender_user_id", excludeUserId);
  }

  const { count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { count: count ?? 0 } });
}
