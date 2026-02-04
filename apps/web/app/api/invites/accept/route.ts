import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      email?: string;
      password?: string;
    };
    const token = body.token?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Token invalido." }, { status: 400 });
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select(
        "id, company_id, employee_id, status, expires_at, employee:employee_id(id, user_id, email)"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle<{
        id: string;
        company_id: string;
        employee_id: string;
        status: string;
        expires_at: string;
        employee: { id: string; user_id: string | null; email: string | null } | null;
      }>();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
    if (!inviteData) {
      return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
    }

    if (inviteData.status !== "pending") {
      if (inviteData.status === "accepted" || inviteData.employee?.user_id) {
        return NextResponse.json({ error: "Convite ja aceito." }, { status: 409 });
      }
      return NextResponse.json({ error: "Convite expirado ou revogado." }, { status: 410 });
    }

    const expiresAt = new Date(inviteData.expires_at);
    if (expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Convite expirado." }, { status: 410 });
    }

    if (inviteData.employee?.user_id) {
      return NextResponse.json({ error: "Convite ja aceito." }, { status: 409 });
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError || !authUser?.user?.id) {
      const message =
        authError?.message?.toLowerCase().includes("already")
          ? "Conta ja existe. Faca login."
          : authError?.message ?? "Falha ao criar usuario.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const newUserId = authUser.user.id;

    const { data: updatedEmployee, error: updateEmployeeError } =
      await supabaseAdmin
        .from("employees")
        .update({
          user_id: newUserId,
          email: inviteData.employee?.email ? undefined : email,
          invitation_status: "accepted"
        })
        .eq("id", inviteData.employee_id)
        .select("id, company_id, role")
        .maybeSingle();

    if (updateEmployeeError || !updatedEmployee) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: "Falha ao vincular colaborador." },
        { status: 500 }
      );
    }

    const { error: updateInviteError } = await supabaseAdmin
      .from("invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", inviteData.id);

    if (updateInviteError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      await supabaseAdmin
        .from("employees")
        .update({ user_id: null, invitation_status: "pending" })
        .eq("id", inviteData.employee_id);
      return NextResponse.json(
        { error: "Falha ao finalizar convite." },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("company_memberships").insert({
      company_id: updatedEmployee.company_id,
      user_id: newUserId,
      role:
        updatedEmployee.role === "owner"
          ? "owner"
          : updatedEmployee.role === "admin"
            ? "admin"
            : "member",
      status: "active"
    });

    await supabaseAdmin.from("user_profiles").upsert({
      user_id: newUserId,
      last_active_company_id: updatedEmployee.company_id
    });

    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("employee_id", inviteData.employee_id)
      .eq("status", "pending")
      .neq("id", inviteData.id);

    return NextResponse.json({
      success: true,
      employee_id: updatedEmployee.id,
      company_id: updatedEmployee.company_id,
      message: "Conta ativada. Faca login."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
