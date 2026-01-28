import { createSupabaseServerClient } from "@/lib/supabase/server";
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

const getCompanyId = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) => {
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

export async function listJobs() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  return listJobsData(supabase, companyId);
}

export async function getJobById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }
  return getJobByIdData(supabase, companyId, id);
}

export async function createJob(input: CreateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return createJobData(supabase, companyId, input);
}

export async function updateJob(id: string, input: UpdateJobInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return updateJobData(supabase, companyId, id, input);
}

export async function updateJobStatus(id: string, status: CreateJobInput["status"]) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return updateJobStatusData(supabase, companyId, id, status);
}

export async function deleteJob(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
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
  const companyId = await getCompanyId(supabase);
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
