import type { SupabaseClient } from "@supabase/supabase-js";

import type { Job, JobRecurrence, JobStatus } from "@fieldvantage/shared";

type JobRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address_id: string | null;
  title: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  estimated_end_at: string | null;
  status: JobStatus;
  notes: string | null;
  is_recurring: boolean;
  recurrence: JobRecurrence | null;
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
  customer_address_id?: string | null;
  scheduled_for: string;
  estimated_end_at?: string | null;
  status: JobStatus;
  notes?: string | null;
  assigned_employee_ids?: string[];
  allow_inactive_assignments?: boolean;
  is_recurring?: boolean;
  recurrence?: JobRecurrence | null;
};

export type UpdateJobInput = Partial<CreateJobInput>;

const toJob = (row: JobRow, assignments: JobAssignmentRow[] = []): Job => ({
  id: row.id,
  company_id: row.company_id,
  customer_id: row.customer_id,
  customer_name: row.customer_name,
  customer_address_id: row.customer_address_id,
  title: row.title,
  status: row.status,
  scheduled_for: `${row.scheduled_date}T${row.scheduled_time?.slice(0, 5) ?? "00:00"}`,
  estimated_end_at: row.estimated_end_at,
  notes: row.notes,
  assigned_employee_ids: assignments.map((assignment) => assignment.employee_id),
  is_recurring: row.is_recurring,
  recurrence: row.recurrence ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at
});

const splitScheduledFor = (scheduledFor: string) => {
  const [date, time] = scheduledFor.split("T");
  return {
    scheduled_date: date,
    scheduled_time: time ? time : null
  };
};

const resolveCustomerName = async (
  supabase: SupabaseClient,
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

export async function listJobs(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(employee_id)"
    )
    .eq("company_id", companyId)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    toJob(
      row as JobRow,
      (row as JobRow & { job_assignments: JobAssignmentRow[] }).job_assignments ??
        []
    )
  );
}

export async function getJobById(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(employee_id)"
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

export async function createJob(
  supabase: SupabaseClient,
  companyId: string,
  input: CreateJobInput
) {
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
    customer_address_id: input.customer_address_id ?? null,
    title: input.title ?? null,
    scheduled_date: scheduled.scheduled_date,
    scheduled_time: scheduled.scheduled_time,
    estimated_end_at: input.estimated_end_at ?? null,
    status: input.status,
    notes: input.notes ?? null,
    is_recurring: input.is_recurring ?? false,
    recurrence: input.recurrence ?? null
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  if (input.assigned_employee_ids?.length) {
    await setJobAssignments(
      supabase,
      data.id,
      input.assigned_employee_ids,
      input.allow_inactive_assignments ?? false
    );
  }

  return toJob(
    data as JobRow,
    input.assigned_employee_ids?.map((id) => ({ employee_id: id })) ?? []
  );
}

export async function updateJob(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
  input: UpdateJobInput
) {
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
    customer_address_id: input.customer_address_id ?? undefined,
    title: input.title ?? undefined,
    scheduled_date: scheduled?.scheduled_date,
    scheduled_time: scheduled?.scheduled_time,
    estimated_end_at: input.estimated_end_at ?? undefined,
    status: input.status ?? undefined,
    notes: input.notes ?? undefined,
    is_recurring: input.is_recurring ?? undefined,
    recurrence: input.recurrence ?? undefined
  };

  const { data, error } = await supabase
    .from("jobs")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  if (input.assigned_employee_ids) {
    await setJobAssignments(
      supabase,
      id,
      input.assigned_employee_ids,
      input.allow_inactive_assignments ?? false
    );
  }

  const assignments =
    input.assigned_employee_ids?.map((employee_id) => ({ employee_id })) ?? [];

  return toJob(data as JobRow, assignments);
}

export async function updateJobStatus(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
  status: CreateJobInput["status"]
) {
  return updateJob(supabase, companyId, id, { status });
}

export async function deleteJob(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
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

export async function setJobAssignments(
  supabase: SupabaseClient,
  jobId: string,
  employeeIds: string[],
  allowInactive = false
) {
  await supabase.from("job_assignments").delete().eq("job_id", jobId);

  if (employeeIds.length === 0) {
    return;
  }

  const payload = employeeIds.map((employeeId) => ({
    job_id: jobId,
    employee_id: employeeId,
    allow_inactive: allowInactive
  }));

  const { error } = await supabase.from("job_assignments").insert(payload);
  if (error) {
    throw error;
  }
}
