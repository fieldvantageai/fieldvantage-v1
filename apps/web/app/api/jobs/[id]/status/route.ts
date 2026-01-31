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

const getCompanyIdForUser = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) => {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (companyError) {
    throw companyError;
  }
  if (company?.id) {
    return company.id;
  }
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (employeeError) {
    throw employeeError;
  }
  return employee?.company_id ?? null;
};

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

  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyIdForUser(supabase, user.id);
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
