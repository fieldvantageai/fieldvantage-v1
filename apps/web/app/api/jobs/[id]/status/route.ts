import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import type { JobStatus } from "@fieldvantage/shared";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const allowedStatuses: JobStatus[] = [
  "scheduled",
  "in_progress",
  "done",
  "canceled"
];

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    status?: JobStatus;
    changedAt?: string;
    note?: string | null;
  };

  if (!body?.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  if (!body.changedAt) {
    return NextResponse.json(
      { error: "Data e hora sao obrigatorias." },
      { status: 400 }
    );
  }

  const parsed = new Date(body.changedAt);
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json(
      { error: "Data e hora invalidas." },
      { status: 400 }
    );
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }
  const supabase = await createSupabaseServerClient();
  const companyId = context.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }

  const { data: existingJob } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: body.status,
      status_changed_at: parsed.toISOString()
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("id, status, status_changed_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }

  if (existingJob?.status && existingJob.status !== body.status) {
    await supabase.from("order_status_events").insert({
      company_id: companyId,
      order_id: id,
      old_status: existingJob.status,
      new_status: body.status,
      changed_at: parsed.toISOString(),
      changed_by: user.id,
      note: body.note?.trim() || null
    });
  }

  return NextResponse.json({ data });
}
