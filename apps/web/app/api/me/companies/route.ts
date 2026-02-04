import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_memberships")
    .select("company_id, role, status, company:company_id(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const companies = (data ?? []).map((row) => ({
    company_id: row.company_id as string,
    company_name: (row as { company?: { name?: string | null } }).company?.name ?? "",
    role: row.role as "owner" | "admin" | "member"
  }));

  return NextResponse.json({ data: companies });
}
