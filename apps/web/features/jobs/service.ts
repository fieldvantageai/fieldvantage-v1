import { getActiveCompanyId } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createJob as createJobData,
  deleteJob as deleteJobData,
  getJobById as getJobByIdData,
  listJobs as listJobsData,
  setJobAssignments as setJobAssignmentsData,
  updateJob as updateJobData,
  updateJobStatus as updateJobStatusData,
  type CreateJobInput,
  type UpdateJobInput
} from "@fieldvantage/data";

const getCompanyId = async () => getActiveCompanyId();

export async function listJobs() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId();
  if (!companyId) {
    return [];
  }
  return listJobsData(supabase, companyId);
}

export async function getJobById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId();
  if (!companyId) {
    return null;
  }
  return getJobByIdData(supabase, companyId, id);
}

export async function createJob(input: CreateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return createJobData(supabase, companyId, input);
}

export async function updateJob(id: string, input: UpdateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return updateJobData(supabase, companyId, id, input);
}

export async function updateJobStatus(id: string, status: CreateJobInput["status"]) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return updateJobStatusData(supabase, companyId, id, status);
}

export async function deleteJob(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId();
  if (!companyId) {
    return false;
  }
  return deleteJobData(supabase, companyId, id);
}

export async function setJobAssignments(jobId: string, employeeIds: string[]) {
  const supabase = await createSupabaseServerClient();
  await setJobAssignmentsData(supabase, jobId, employeeIds);
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
  const companyId = await getCompanyId();
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
  const companyId = await getCompanyId();
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
  const events = await listOrderStatusEvents(orderId);
  const actorIds = Array.from(
    new Set(events.map((event) => event.changed_by).filter(Boolean))
  ) as string[];

  if (actorIds.length === 0) {
    return events as OrderStatusEventWithActor[];
  }

  const actorMap = new Map<string, { name?: string | null; email?: string | null }>();
  await Promise.all(
    actorIds.map(async (id) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      const name =
        (data?.user?.user_metadata as { full_name?: string } | null)?.full_name ??
        (data?.user?.user_metadata as { owner_name?: string } | null)?.owner_name ??
        null;
      const email = data?.user?.email ?? null;
      actorMap.set(id, { name, email });
    })
  );

  return events.map((event) => {
    const actor = event.changed_by ? actorMap.get(event.changed_by) : null;
    return {
      ...event,
      actor_name: actor?.name ?? null,
      actor_email: actor?.email ?? null
    };
  }) as OrderStatusEventWithActor[];
}
