import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "company_invite")
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { count: count ?? 0 } });
}
