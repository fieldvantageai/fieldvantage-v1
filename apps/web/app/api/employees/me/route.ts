import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "id, company_id, user_id, full_name, email, role, is_active, avatar_url"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !employee) {
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
      avatar_signed_url: avatarSignedUrl
    }
  });
}
