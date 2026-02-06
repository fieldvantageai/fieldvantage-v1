import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Audit (V1):
// Tables: public.invites (company_id, employee_id, token_hash, status, expires_at, accepted_at, email/role/full_name, accepted_by),
// public.company_memberships (company_id, user_id, role, status), public.employees (user_id, email, role).
// Routes/components: /api/invites/validate, /api/invites/accept, /api/invites/email, InviteAcceptForm.

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

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select(
        "id, company_id, employee_id, status, expires_at, role, email, employee:employee_id(id, user_id, email, role)"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle<{
        id: string;
        company_id: string;
        employee_id: string;
        status: string;
        expires_at: string;
        role: string | null;
        email: string | null;
        employee: {
          id: string;
          user_id: string | null;
          email: string | null;
          role: string | null;
        } | null;
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

    const existingUserId = inviteData.employee?.user_id ?? null;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const resolvedEmail =
      inviteData.email ??
      inviteData.employee?.email ??
      email ??
      user?.email ??
      "";
    if (!emailRegex.test(resolvedEmail)) {
      return NextResponse.json({ error: "Email invalido." }, { status: 400 });
    }

    if (!inviteData.employee?.email && emailRegex.test(resolvedEmail)) {
      await supabaseAdmin
        .from("employees")
        .update({ email: resolvedEmail })
        .eq("id", inviteData.employee_id);
      await supabaseAdmin
        .from("invites")
        .update({ email: resolvedEmail })
        .eq("id", inviteData.id);
    }

    const roleValue =
      inviteData.role ??
      inviteData.employee?.role ??
      "member";
    const normalizedRole =
      roleValue === "owner"
        ? "owner"
        : roleValue === "admin"
          ? "admin"
          : "member";

    if (user) {
      const sessionEmail = user.email?.toLowerCase() ?? "";
      if (sessionEmail && sessionEmail !== resolvedEmail) {
        return NextResponse.json(
          { error: "Conta errada. Entre com o email convidado.", code: "wrong_account" },
          { status: 409 }
        );
      }
      if (existingUserId && existingUserId !== user.id) {
        return NextResponse.json({ error: "Convite ja aceito." }, { status: 409 });
      }

      const { data: updatedEmployee, error: updateEmployeeError } =
        await supabaseAdmin
          .from("employees")
          .update({
            user_id: user.id,
            invitation_status: "accepted"
          })
          .eq("id", inviteData.employee_id)
          .select("id")
          .maybeSingle();

      if (updateEmployeeError || !updatedEmployee) {
        return NextResponse.json(
          { error: "Falha ao vincular colaborador." },
          { status: 500 }
        );
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
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("entity_id", inviteData.id)
        .eq("user_id", user.id);

      await supabaseAdmin
        .from("user_notifications")
        .delete()
        .eq("entity_id", inviteData.id)
        .neq("user_id", user.id);

      await supabaseAdmin
        .from("invites")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("employee_id", inviteData.employee_id)
        .eq("status", "pending")
        .neq("id", inviteData.id);

      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_COMPANY_COOKIE, inviteData.company_id, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/"
      });

      return NextResponse.json({
        success: true,
        employee_id: updatedEmployee.id,
        company_id: inviteData.company_id
      });
    }

    if (existingUserId) {
      return NextResponse.json({ error: "Convite ja aceito." }, { status: 409 });
    }

    if (!password) {
      return NextResponse.json(
        { error: "Faca login para aceitar o convite." },
        { status: 401 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: resolvedEmail,
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
          invitation_status: "accepted"
        })
        .eq("id", inviteData.employee_id)
        .select("id")
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
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: newUserId
      })
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

    await supabaseAdmin
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("entity_id", inviteData.id)
      .eq("user_id", newUserId);

    await supabaseAdmin
      .from("user_notifications")
      .delete()
      .eq("entity_id", inviteData.id)
      .neq("user_id", newUserId);

    await supabaseAdmin
      .from("company_memberships")
      .upsert(
        {
          company_id: inviteData.company_id,
          user_id: newUserId,
          role: normalizedRole,
          status: "active"
        },
        { onConflict: "company_id,user_id" }
      );

    await supabaseAdmin.from("user_profiles").upsert({
      user_id: newUserId,
      last_active_company_id: inviteData.company_id
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
      company_id: inviteData.company_id,
      message: "Conta ativada. Faca login."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
