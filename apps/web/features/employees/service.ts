import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createEmployee as createEmployeeData,
  deleteEmployee as deleteEmployeeData,
  getEmployeeById as getEmployeeByIdData,
  listEmployees as listEmployeesData,
  updateEmployee as updateEmployeeData,
  type CreateEmployeeInput,
  type UpdateEmployeeInput
} from "@fieldvantage/data";
import type { Employee, JobStatus } from "@fieldvantage/shared";

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
  if (data?.id) {
    return data.id;
  }
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (employeeError) {
    throw employeeError;
  }
  return employeeData?.company_id ?? null;
};

export async function listEmployees() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  const employees = await listEmployeesData(supabase, companyId);
  if (employees.length === 0) {
    return employees;
  }

  const employeeIds = employees.map((employee) => employee.id);
  const { data: assignments, error } = await supabase
    .from("job_assignments")
    .select("employee_id")
    .in("employee_id", employeeIds);

  if (error) {
    return employees;
  }

  const counts = new Map<string, number>();
  (assignments ?? []).forEach((row) => {
    const id = row.employee_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });

  const { data: completedAssignments } = await supabase
    .from("jobs")
    .select("id, job_assignments!inner(employee_id)")
    .eq("company_id", companyId)
    .eq("status", "done")
    .in("job_assignments.employee_id", employeeIds);

  const completedCounts = new Map<string, number>();
  (completedAssignments ?? []).forEach((row) => {
    const assignments = row.job_assignments as Array<{ employee_id: string }>;
    assignments.forEach((assignment) => {
      const id = assignment.employee_id;
      completedCounts.set(id, (completedCounts.get(id) ?? 0) + 1);
    });
  });

  return employees.map((employee) => ({
    ...employee,
    job_assignments_count: counts.get(employee.id) ?? 0,
    completed_jobs_count: completedCounts.get(employee.id) ?? 0
  }));
}

export type EmployeeWithAvatar = Employee & {
  avatar_signed_url?: string | null;
};

export async function getEmployeeById(id: string): Promise<EmployeeWithAvatar | null> {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }
  const employee = await getEmployeeByIdData(supabase, companyId, id);
  if (!employee) {
    return null;
  }
  let avatarSignedUrl: string | null = null;
  if (employee.avatar_url) {
    const { data } = await supabaseAdmin.storage
      .from("customer-avatars")
      .createSignedUrl(employee.avatar_url, 60 * 60);
    avatarSignedUrl = data?.signedUrl ?? null;
  }
  return {
    ...employee,
    avatar_signed_url: avatarSignedUrl
  };
}

export async function createEmployee(input: CreateEmployeeInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return createEmployeeData(supabase, companyId, input);
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return updateEmployeeData(supabase, companyId, id, input);
}

export async function deleteEmployee(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return false;
  }
  return deleteEmployeeData(supabase, companyId, id);
}

export type EmployeeJobSummary = {
  id: string;
  title: string | null;
  customer_name: string | null;
  status: JobStatus;
  scheduled_for: string;
};

const toScheduledFor = (date: string, time?: string | null) =>
  `${date}T${time?.slice(0, 5) ?? "00:00"}`;

export async function listEmployeeJobs(employeeId: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, customer_name, status, scheduled_date, scheduled_time, job_assignments!inner(employee_id)"
    )
    .eq("company_id", companyId)
    .eq("job_assignments.employee_id", employeeId)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string | null,
    customer_name: row.customer_name as string | null,
    status: row.status as JobStatus,
    scheduled_for: toScheduledFor(
      row.scheduled_date as string,
      row.scheduled_time as string | null
    )
  }));
}
