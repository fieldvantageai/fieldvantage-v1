import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAuthUser } from "@/features/_shared/server";
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

  const supabase = await createSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (companyError || !company?.id) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }

  const { data: existingJob } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: body.status,
      status_changed_at: parsed.toISOString()
    })
    .eq("id", id)
    .eq("company_id", company.id)
    .select("id, status, status_changed_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }

  if (existingJob?.status && existingJob.status !== body.status) {
    await supabase.from("job_events").insert({
      company_id: company.id,
      job_id: id,
      event_type: "status_changed",
      event_label: `Status changed to ${body.status}`,
      from_status: existingJob.status,
      to_status: body.status,
      occurred_at: parsed.toISOString(),
      created_by: user.id
    });
  }

  return NextResponse.json({ data });
}
