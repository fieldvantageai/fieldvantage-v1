import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/company/getActiveCompanyContext";
import type { Job, JobStatus } from "@fieldvantage/shared";

type JobAssignmentRow = {
  membership_id: string;
  allow_inactive: boolean;
};

const toScheduledFor = (date: string, time?: string | null) =>
  `${date}T${time?.slice(0, 5) ?? "00:00"}`;

const splitScheduledFor = (value: string) => {
  const [date, time] = value.split("T");
  return {
    scheduled_date: date,
    scheduled_time: time ? `${time}:00` : null
  };
};

export async function listJobs() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(membership_id)"
    )
    .eq("company_id", companyId)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const assignments = (row as {
      job_assignments?: Array<{ membership_id: string }>;
    }).job_assignments ?? [];
    return {
      id: row.id,
      company_id: row.company_id,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      customer_address_id: row.customer_address_id,
      title: row.title,
      status: row.status,
      scheduled_for: toScheduledFor(row.scheduled_date, row.scheduled_time),
      estimated_end_at: row.estimated_end_at,
      notes: row.notes,
      is_recurring: row.is_recurring,
      recurrence: row.recurrence,
      assigned_membership_ids: assignments.map((item) => item.membership_id),
      created_at: row.created_at,
      updated_at: row.updated_at
    } as Job;
  });
}

export async function getJobById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    return null;
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(membership_id, allow_inactive)"
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const assignments = (data as {
    job_assignments?: JobAssignmentRow[];
  }).job_assignments ?? [];

  return {
    id: data.id,
    company_id: data.company_id,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_address_id: data.customer_address_id,
    title: data.title,
    status: data.status,
    scheduled_for: toScheduledFor(data.scheduled_date, data.scheduled_time),
    estimated_end_at: data.estimated_end_at,
    notes: data.notes,
    is_recurring: data.is_recurring,
    recurrence: data.recurrence,
    assigned_membership_ids: assignments.map((item) => item.membership_id),
    allow_inactive_assignments: assignments.some((item) => item.allow_inactive),
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Job & { allow_inactive_assignments?: boolean };
}

export type CreateJobInput = {
  title: string;
  status: JobStatus;
  scheduled_for: string;
  estimated_end_at?: string | null;
  customer_name: string;
  customer_id?: string | null;
  customer_address_id?: string | null;
  assigned_membership_ids?: string[];
  allow_inactive_assignments?: boolean;
  is_recurring?: boolean;
  recurrence?: Job["recurrence"];
  notes?: string | null;
};

export async function createJob(input: CreateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const schedule = splitScheduledFor(input.scheduled_for);
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      company_id: companyId,
      customer_id: input.customer_id ?? null,
      customer_name: input.customer_name ?? null,
      customer_address_id: input.customer_address_id ?? null,
      title: input.title ?? null,
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time,
      estimated_end_at: input.estimated_end_at ?? null,
      status: input.status,
      notes: input.notes ?? null,
      is_recurring: input.is_recurring ?? false,
      recurrence: input.recurrence ?? null
    })
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Erro ao criar ordem.");
  }

  if (input.assigned_membership_ids?.length) {
    await setJobAssignments(data.id as string, input.assigned_membership_ids, {
      allow_inactive: Boolean(input.allow_inactive_assignments),
      companyId
    });
  }

  return {
    id: data.id,
    company_id: data.company_id,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_address_id: data.customer_address_id,
    title: data.title,
    status: data.status,
    scheduled_for: toScheduledFor(data.scheduled_date, data.scheduled_time),
    estimated_end_at: data.estimated_end_at,
    notes: data.notes,
    is_recurring: data.is_recurring,
    recurrence: data.recurrence,
    assigned_membership_ids: input.assigned_membership_ids ?? [],
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Job;
}

export type UpdateJobInput = Partial<CreateJobInput>;

export async function updateJob(id: string, input: UpdateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const schedule = input.scheduled_for
    ? splitScheduledFor(input.scheduled_for)
    : null;

  const { data, error } = await supabase
    .from("jobs")
    .update({
      title: input.title ?? undefined,
      status: input.status ?? undefined,
      customer_name: input.customer_name ?? undefined,
      customer_id: input.customer_id ?? undefined,
      customer_address_id: input.customer_address_id ?? undefined,
      scheduled_date: schedule?.scheduled_date ?? undefined,
      scheduled_time: schedule?.scheduled_time ?? undefined,
      estimated_end_at: input.estimated_end_at ?? undefined,
      notes: input.notes ?? undefined,
      is_recurring: input.is_recurring ?? undefined,
      recurrence: input.recurrence ?? undefined
    })
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at"
    )
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Erro ao atualizar ordem.");
  }

  if (input.assigned_membership_ids) {
    await setJobAssignments(id, input.assigned_membership_ids, {
      allow_inactive: Boolean(input.allow_inactive_assignments),
      companyId
    });
  }

  return {
    id: data.id,
    company_id: data.company_id,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_address_id: data.customer_address_id,
    title: data.title,
    status: data.status,
    scheduled_for: toScheduledFor(data.scheduled_date, data.scheduled_time),
    estimated_end_at: data.estimated_end_at,
    notes: data.notes,
    is_recurring: data.is_recurring,
    recurrence: data.recurrence,
    assigned_membership_ids: input.assigned_membership_ids ?? [],
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Job;
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at"
    )
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Erro ao atualizar status.");
  }

  return {
    id: data.id,
    company_id: data.company_id,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_address_id: data.customer_address_id,
    title: data.title,
    status: data.status,
    scheduled_for: toScheduledFor(data.scheduled_date, data.scheduled_time),
    estimated_end_at: data.estimated_end_at,
    notes: data.notes,
    is_recurring: data.is_recurring,
    recurrence: data.recurrence,
    assigned_membership_ids: [],
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Job;
}

export async function deleteJob(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    return false;
  }

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) {
    return false;
  }

  return true;
}

export async function setJobAssignments(
  jobId: string,
  membershipIds: string[],
  options?: { allow_inactive?: boolean; companyId?: string }
) {
  const supabase = await createSupabaseServerClient();
  const companyId = options?.companyId ?? (await getActiveCompanyId());
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  await supabase.from("job_assignments").delete().eq("job_id", jobId);

  if (membershipIds.length === 0) {
    return;
  }

  const payload = membershipIds.map((membershipId) => ({
    job_id: jobId,
    membership_id: membershipId,
    company_id: companyId,
    allow_inactive: Boolean(options?.allow_inactive)
  }));

  const { error } = await supabase.from("job_assignments").insert(payload);
  if (error) {
    throw error;
  }
}

export type JobEvent = {
  id: string;
  job_id: string;
  company_id: string;
  event_type: "created" | "status_changed";
  event_label: string;
  from_status: string | null;
  to_status: string | null;
  occurred_at: string;
  created_by: string | null;
  created_at: string;
};

export async function listJobEvents(jobId: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    return [];
  }
  const { data, error } = await supabase
    .from("job_events")
    .select(
      "id, job_id, company_id, event_type, event_label, from_status, to_status, occurred_at, created_by, created_at"
    )
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as JobEvent[];
}

export type OrderStatusEvent = {
  id: string;
  company_id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
  note?: string | null;
  created_at: string;
};

export async function listOrderStatusEvents(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    return [];
  }
  const { data, error } = await supabase
    .from("order_status_events")
    .select(
      "id, company_id, order_id, old_status, new_status, changed_at, changed_by, note, created_at"
    )
    .eq("company_id", companyId)
    .eq("order_id", orderId)
    .order("changed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as OrderStatusEvent[];
}

export type OrderStatusEventWithActor = OrderStatusEvent & {
  actor_name?: string | null;
  actor_email?: string | null;
};

export async function listOrderStatusEventsWithActors(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const events = await listOrderStatusEvents(orderId);
  const actorIds = Array.from(
    new Set(events.map((event) => event.changed_by).filter(Boolean))
  ) as string[];

  if (actorIds.length === 0) {
    return events as OrderStatusEventWithActor[];
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("user_id, full_name, email")
    .in("user_id", actorIds);

  const actorMap = new Map<string, { name?: string | null; email?: string | null }>();
  (employees ?? []).forEach((employee) => {
    actorMap.set(employee.user_id as string, {
      name: employee.full_name as string,
      email: employee.email as string | null
    });
  });

  return events.map((event) => {
    const actor = event.changed_by ? actorMap.get(event.changed_by) : null;
    return {
      ...event,
      actor_name: actor?.name ?? null,
      actor_email: actor?.email ?? null
    };
  }) as OrderStatusEventWithActor[];
}
