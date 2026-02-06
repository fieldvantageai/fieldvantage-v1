import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/company/getActiveCompanyContext";
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
    .select("id, entity_id, company_id")
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
    .select(
      "id, company_id, employee_id, status, expires_at, role, employee:employee_id(id, user_id, email, role)"
    )
    .eq("id", notification.entity_id)
    .maybeSingle<{
      id: string;
      company_id: string;
      employee_id: string;
      status: string;
      expires_at: string;
      role: string | null;
      employee: { id: string; user_id: string | null; email: string | null; role?: string | null } | null;
    }>();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }
  if (!inviteData) {
    return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
  }
  if (inviteData.status !== "pending") {
    return NextResponse.json({ error: "Convite expirado ou revogado." }, { status: 410 });
  }
  if (new Date(inviteData.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Convite expirado." }, { status: 410 });
  }

  if (inviteData.employee?.user_id && inviteData.employee.user_id !== user.id) {
    return NextResponse.json({ error: "Convite ja aceito." }, { status: 409 });
  }

  const roleValue = inviteData.role ?? inviteData.employee?.role ?? "member";
  const normalizedRole =
    roleValue === "owner" ? "owner" : roleValue === "admin" ? "admin" : "member";

  const { error: updateEmployeeError } = await supabaseAdmin
    .from("employees")
    .update({
      user_id: user.id,
      invitation_status: "accepted"
    })
    .eq("id", inviteData.employee_id);

  if (updateEmployeeError) {
    return NextResponse.json({ error: "Falha ao vincular colaborador." }, { status: 500 });
  }

  await supabaseAdmin
    .from("company_memberships")
    .upsert(
      {
        company_id: inviteData.company_id,
        user_id: user.id,
        role: normalizedRole,
        status: "active"
      },
      { onConflict: "company_id,user_id" }
    );

  await supabaseAdmin.from("user_profiles").upsert({
    user_id: user.id,
    last_active_company_id: inviteData.company_id
  });

  await supabaseAdmin
    .from("invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id
    })
    .eq("id", inviteData.id);

  await supabaseAdmin
    .from("invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("employee_id", inviteData.employee_id)
    .eq("status", "pending")
    .neq("id", inviteData.id);

  await supabaseAdmin
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notification.id)
    .eq("user_id", user.id);

  await supabaseAdmin
    .from("user_notifications")
    .delete()
    .eq("entity_id", inviteData.id)
    .neq("user_id", user.id);

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, inviteData.company_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/"
  });

  return NextResponse.json({ success: true, redirect: "/dashboard" });
}
