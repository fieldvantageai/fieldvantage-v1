import { NextResponse } from "next/server";
import crypto from "crypto";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildInviteLink } from "@/lib/url";

export async function POST(request: Request) {
  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { employee_id } = (await request.json()) as { employee_id?: string };
    if (!employee_id) {
      return NextResponse.json({ error: "employee_id obrigatorio." }, { status: 400 });
    }

    const context = await getActiveCompanyContext();
    if (!context) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }
    if (context.role === "member") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, company_id, invitation_status, email, full_name, role")
      .eq("id", employee_id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (employee.company_id !== context.companyId) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    // Busca o convite pendente atual para preservar branch_id/branch_ids e role originais
    const { data: previousInvite } = await supabaseAdmin
      .from("invites")
      .select("branch_id, branch_ids, role")
      .eq("employee_id", employee.id)
      .eq("company_id", context.companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { branch_id: string | null; branch_ids: string[] | null; role: string | null } | null };

    // Reconstrói branch_ids de forma segura (legado: só branch_id preenchido)
    const preservedBranchIds: string[] =
      previousInvite?.branch_ids && previousInvite.branch_ids.length > 0
        ? previousInvite.branch_ids
        : previousInvite?.branch_id
          ? [previousInvite.branch_id]
          : [];
    const preservedBranchId = preservedBranchIds[0] ?? null;
    const preservedRole = previousInvite?.role ?? employee.role ?? null;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("employee_id", employee.id)
      .eq("status", "pending");

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .insert({
        company_id: context.companyId,
        employee_id: employee.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        created_by: user.id,
        email: employee.email ?? null,
        full_name: employee.full_name ?? null,
        role: preservedRole,
        branch_id: preservedBranchId,
        branch_ids: preservedBranchIds.length > 0 ? preservedBranchIds : null
      })
      .select("id, status, expires_at")
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: inviteError?.message ?? "Erro ao criar convite." },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("employees")
      .update({ invitation_status: "pending" })
      .eq("id", employee.id);

    const inviteLink = buildInviteLink(request, rawToken);
    let existingUserNotice: string | null = null;

    const findAuthUserIdByEmail = async (emailValue: string) => {
      const normalized = emailValue.toLowerCase();
      let page = 1;
      const perPage = 200;
      while (page <= 5) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage
        });
        if (error || !data?.users?.length) {
          return null;
        }
        const match = data.users.find(
          (item) => item.email?.toLowerCase() === normalized
        );
        if (match?.id) {
          return match.id;
        }
        if (data.users.length < perPage) {
          break;
        }
        page += 1;
      }
      return null;
    };

    if (employee.email) {
      const existingUserId = await findAuthUserIdByEmail(employee.email);
      if (existingUserId) {
        const { error: notifyError } = await supabaseAdmin
          .from("user_notifications")
          .upsert(
            {
              user_id: existingUserId,
              type: "company_invite",
              entity_id: invite.id,
              company_id: context.companyId
            },
            { onConflict: "user_id,type,entity_id" }
          );
        if (!notifyError) {
          existingUserNotice =
            "Usuario ja possui conta. Ele sera notificado no app.";
        }
      }
    }

    return NextResponse.json({
      invite,
      invite_link: inviteLink,
      existing_user_notified: Boolean(existingUserNotice),
      notice: existingUserNotice
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
