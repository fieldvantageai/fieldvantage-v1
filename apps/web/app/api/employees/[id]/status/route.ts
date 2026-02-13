import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
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

    const context = await getActiveCompanyContext();
    if (!context) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }
    if (context.role === "member") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (!employee.user_id) {
      return NextResponse.json({ error: "Colaborador invalido." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("company_memberships")
      .update({ status: body.status === "active" ? "active" : "inactive" })
      .eq("company_id", context.companyId)
      .eq("user_id", employee.user_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
