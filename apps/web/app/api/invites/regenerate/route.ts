import { NextResponse } from "next/server";
import crypto from "crypto";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CompanyAuth = {
  companyId: string;
  role: "owner" | "admin";
};

const getCompanyForUser = async (user: { id: string; email?: string | null }) => {
  const { data: ownedCompany, error: ownerError } = await supabaseAdmin
    .from("companies")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownerError) {
    throw ownerError;
  }

  if (ownedCompany?.id) {
    return { companyId: ownedCompany.id, role: "owner" as const };
  }

  const email = user.email?.trim();
  if (!email) {
    return null;
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select("company_id, role")
    .ilike("email", email)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (employeeError) {
    throw employeeError;
  }

  if (!employee?.company_id) {
    return null;
  }

  return {
    companyId: employee.company_id,
    role: employee.role as "owner" | "admin"
  } as CompanyAuth;
};

const buildInviteLink = (request: Request, rawToken: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/invite/accept?token=${rawToken}`;
};

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

    const company = await getCompanyForUser({
      id: user.id,
      email: user.email ?? null
    });
    if (!company) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, company_id, invitation_status")
      .eq("id", employee_id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (employee.company_id !== company.companyId) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

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
        company_id: company.companyId,
        employee_id: employee.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        created_by: user.id
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

    return NextResponse.json({
      invite,
      invite_link: inviteLink
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
