import { NextResponse } from "next/server";

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
      .select("id, company_id, user_id")
      .eq("id", employee_id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (employee.company_id !== company.companyId) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("employee_id", employee.id)
      .eq("status", "pending");

    if (!employee.user_id) {
      await supabaseAdmin
        .from("employees")
        .update({ invitation_status: "revoked" })
        .eq("id", employee.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
