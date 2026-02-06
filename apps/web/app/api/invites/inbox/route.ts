import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Audit (V1):
// Tables: public.invites, public.company_memberships, public.user_notifications.
// Invite flows: app/api/employees/route.ts (create invite),
// app/api/invites/accept/route.ts (token accept),
// app/api/invites/regenerate/route.ts.
// Topbar: components/layout/AppShell.tsx (icons/badges).
export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_notifications")
    .select(
      `
      id,
      type,
      entity_id,
      company_id,
      read_at,
      created_at,
      invite:entity_id (
        id,
        status,
        expires_at,
        role,
        created_at,
        company_id,
        company:company_id (
          id,
          name
        )
      )
    `
    )
    .eq("user_id", user.id)
    .eq("type", "company_invite")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const items = (data ?? [])
    .map((row) => {
      const invite = Array.isArray(row.invite) ? row.invite[0] : row.invite;
      if (!invite || invite.status !== "pending") {
        return null;
      }
      return {
        id: row.id,
        read_at: row.read_at,
        created_at: row.created_at,
        invite
      };
    })
    .filter(Boolean);

  return NextResponse.json({ data: items });
}
