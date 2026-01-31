import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as { status?: "active" | "inactive" };
    if (!body.status || !["active", "inactive"].includes(body.status)) {
      return NextResponse.json({ error: "Status invalido." }, { status: 400 });
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
      .select("id, company_id, email, is_active")
      .eq("id", id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (employee.company_id !== company.companyId) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({ is_active: body.status === "active" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (employee.email) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(
        (item) => item.email?.toLowerCase() === employee.email?.toLowerCase()
      );
      if (authUser?.id) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...(authUser.user_metadata ?? {}),
            is_active: body.status === "active"
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
