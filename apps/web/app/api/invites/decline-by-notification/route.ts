import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { notification_id } = (await request.json()) as {
    notification_id?: string;
  };
  if (!notification_id) {
    return NextResponse.json(
      { error: "notification_id obrigatorio." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: notification, error: notificationError } = await supabase
    .from("user_notifications")
    .select("id, entity_id")
    .eq("id", notification_id)
    .eq("user_id", user.id)
    .eq("type", "company_invite")
    .maybeSingle();

  if (notificationError) {
    return NextResponse.json({ error: notificationError.message }, { status: 400 });
  }
  if (!notification) {
    return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
  }

  const { data: inviteData, error: inviteError } = await supabaseAdmin
    .from("invites")
    .select("id, employee_id, status")
    .eq("id", notification.entity_id)
    .maybeSingle<{ id: string; employee_id: string; status: string }>();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }
  if (!inviteData) {
    return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
  }

  if (inviteData.status === "pending") {
    await supabaseAdmin
      .from("invites")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString()
      })
      .eq("id", inviteData.id);

    await supabaseAdmin
      .from("employees")
      .update({ invitation_status: "revoked" })
      .eq("id", inviteData.employee_id);
  }

  await supabaseAdmin
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notification.id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
