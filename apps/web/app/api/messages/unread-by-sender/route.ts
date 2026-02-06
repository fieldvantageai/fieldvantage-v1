import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ data: {} });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .select("sender_user_id")
    .eq("company_id", context.companyId)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const senderId = row.sender_user_id as string;
    counts[senderId] = (counts[senderId] ?? 0) + 1;
  });

  return NextResponse.json({ data: counts });
}
