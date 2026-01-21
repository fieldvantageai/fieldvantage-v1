import type { Job } from "@/features/_shared/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JobRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  customer_name: string | null;
  title: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  expected_completion: string | null;
  status: "scheduled" | "in_progress" | "done" | "canceled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type JobAssignmentRow = {
  employee_id: string;
};

export type CreateJobInput = {
  title?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  scheduled_for: string;
  expected_completion?: string | null;
  status: "scheduled" | "in_progress" | "done" | "canceled";
  notes?: string | null;
  assigned_employee_ids?: string[];
};

export type UpdateJobInput = Partial<CreateJobInput>;

const toJob = (row: JobRow, assignments: JobAssignmentRow[] = []): Job => ({
  id: row.id,
  company_id: row.company_id,
  customer_id: row.customer_id,
  customer_name: row.customer_name,
  title: row.title,
  status: row.status,
  scheduled_for: `${row.scheduled_date}T${row.scheduled_time?.slice(0, 5) ?? "00:00"}`,
  expected_completion: row.expected_completion,
  notes: row.notes,
  assigned_employee_ids: assignments.map((assignment) => assignment.employee_id),
  created_at: row.created_at,
  updated_at: row.updated_at
});

const getCompanyId = async (supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return null;
  }
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", authData.user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.id ?? null;
};

const splitScheduledFor = (scheduledFor: string) => {
  const [date, time] = scheduledFor.split("T");
  return {
    scheduled_date: date,
    scheduled_time: time ? time : null
  };
};

const resolveCustomerName = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  customerId?: string | null,
  fallbackName?: string | null
) => {
  if (!customerId) {
    return fallbackName ?? null;
  }
  const { data, error } = await supabase
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.name ?? fallbackName ?? null;
};

export async function listJobs() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_id, customer_id, customer_name, title, scheduled_date, scheduled_time, expected_completion, status, notes, created_at, updated_at, job_assignments(employee_id)"
    )
    .eq("company_id", companyId)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    toJob(row as JobRow, (row as JobRow & { job_assignments: JobAssignmentRow[] }).job_assignments ?? [])
  );
}

export async function getJobById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_id, customer_id, customer_name, title, scheduled_date, scheduled_time, expected_completion, status, notes, created_at, updated_at, job_assignments(employee_id)"
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const assignments = (data as JobRow & { job_assignments: JobAssignmentRow[] })
    .job_assignments;

  return toJob(data as JobRow, assignments ?? []);
}

export async function createJob(input: CreateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const scheduled = splitScheduledFor(input.scheduled_for);
  const customerName = await resolveCustomerName(
    supabase,
    input.customer_id ?? null,
    input.customer_name ?? null
  );

  const payload = {
    company_id: companyId,
    customer_id: input.customer_id ?? null,
    customer_name: customerName,
    title: input.title ?? null,
    scheduled_date: scheduled.scheduled_date,
    scheduled_time: scheduled.scheduled_time,
    expected_completion: input.expected_completion ?? null,
    status: input.status,
    notes: input.notes ?? null
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select(
      "id, company_id, customer_id, customer_name, title, scheduled_date, scheduled_time, expected_completion, status, notes, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  if (input.assigned_employee_ids?.length) {
    await setJobAssignments(data.id, input.assigned_employee_ids);
  }

  return toJob(data as JobRow, input.assigned_employee_ids?.map((id) => ({ employee_id: id })) ?? []);
}

export async function updateJob(id: string, input: UpdateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const scheduled = input.scheduled_for
    ? splitScheduledFor(input.scheduled_for)
    : null;

  const customerName = await resolveCustomerName(
    supabase,
    input.customer_id ?? null,
    input.customer_name ?? null
  );

  const payload = {
    customer_id: input.customer_id ?? undefined,
    customer_name: customerName ?? undefined,
    title: input.title ?? undefined,
    scheduled_date: scheduled?.scheduled_date,
    scheduled_time: scheduled?.scheduled_time,
    expected_completion: input.expected_completion ?? undefined,
    status: input.status ?? undefined,
    notes: input.notes ?? undefined
  };

  const { data, error } = await supabase
    .from("jobs")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, customer_id, customer_name, title, scheduled_date, scheduled_time, expected_completion, status, notes, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  if (input.assigned_employee_ids) {
    await setJobAssignments(id, input.assigned_employee_ids);
  }

  const assignments =
    input.assigned_employee_ids?.map((employee_id) => ({ employee_id })) ??
    [];

  return toJob(data as JobRow, assignments);
}

export async function updateJobStatus(id: string, status: CreateJobInput["status"]) {
  return updateJob(id, { status });
}

export async function deleteJob(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return false;
  }
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

export async function setJobAssignments(jobId: string, employeeIds: string[]) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("job_assignments").delete().eq("job_id", jobId);

  if (employeeIds.length === 0) {
    return;
  }

  const payload = employeeIds.map((employeeId) => ({
    job_id: jobId,
    employee_id: employeeId
  }));

  const { error } = await supabase.from("job_assignments").insert(payload);
  if (error) {
    throw error;
  }
}
