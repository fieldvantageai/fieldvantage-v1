import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteParams = {
  params: Promise<{ id: string; attachmentId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: jobId, attachmentId } = await params;
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json(
      { error: "Empresa nao encontrada." },
      { status: 404 }
    );
  }

  const { data: attachment } = await supabaseAdmin
    .from("job_attachments")
    .select("*")
    .eq("id", attachmentId)
    .eq("job_id", jobId)
    .eq("company_id", context.companyId)
    .maybeSingle();

  if (!attachment) {
    return NextResponse.json(
      { error: "Anexo nao encontrado." },
      { status: 404 }
    );
  }

  await supabaseAdmin.storage
    .from("job-attachments")
    .remove([attachment.storage_path]);

  const { error } = await supabaseAdmin
    .from("job_attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: jobId, attachmentId } = await params;
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json(
      { error: "Empresa nao encontrada." },
      { status: 404 }
    );
  }

  const body = await request.json();
  const note =
    typeof body.note === "string" ? body.note.trim() || null : undefined;

  if (note === undefined) {
    return NextResponse.json(
      { error: "Campo note obrigatorio." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("job_attachments")
    .update({ note })
    .eq("id", attachmentId)
    .eq("job_id", jobId)
    .eq("company_id", context.companyId)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Anexo nao encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}
