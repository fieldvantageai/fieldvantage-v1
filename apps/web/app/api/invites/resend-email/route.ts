import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
      .select("id, company_id, email")
      .eq("id", employee_id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (employee.company_id !== context.companyId) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    if (!employee.email) {
      return NextResponse.json(
        { error: "Colaborador sem email." },
        { status: 400 }
      );
    }

    const { data: invite } = await supabaseAdmin
      .from("invites")
      .select("id, status")
      .eq("employee_id", employee.id)
      .eq("status", "pending")
      .maybeSingle();

    if (!invite) {
      return NextResponse.json(
        { error: "Nenhum convite pendente. Gere um novo link." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Envio de email nao configurado; copie o link."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
