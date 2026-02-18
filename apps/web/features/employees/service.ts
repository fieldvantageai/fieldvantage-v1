import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import type { Employee, JobStatus } from "@fieldvantage/shared";

type MembershipRow = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
};

type EmployeeRow = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string | null;
};

const pickNewestEmployee = (rows: EmployeeRow[]) =>
  rows.sort((a, b) => {
    const aTime = new Date(a.updated_at ?? a.created_at).getTime();
    const bTime = new Date(b.updated_at ?? b.created_at).getTime();
    return bTime - aTime;
  })[0];

export async function listEmployees() {
  const context = await getActiveCompanyContext();
  if (!context) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from("company_memberships")
    .select("id, user_id, role, status, created_at")
    .eq("company_id", context.companyId);

  if (error || !memberships?.length) {
    return [];
  }

  const membershipRows = memberships as MembershipRow[];
  const userIds = membershipRows.map((item) => item.user_id).filter(Boolean);

  const { data: employees } = userIds.length
    ? await supabase
        .from("employees")
        .select(
          "id, user_id, full_name, first_name, last_name, email, phone, role, is_active, avatar_url, created_at, updated_at"
        )
        .in("user_id", userIds)
    : { data: [] };

  const employeesByUser = new Map<string, EmployeeRow>();
  (employees ?? []).forEach((row) => {
    const userId = row.user_id ?? "";
    if (!userId) {
      return;
    }
    const existing = employeesByUser.get(userId);
    if (!existing) {
      employeesByUser.set(userId, row as EmployeeRow);
      return;
    }
    employeesByUser.set(userId, pickNewestEmployee([existing, row as EmployeeRow]));
  });

  const membershipIds = membershipRows.map((item) => item.id);
  const { data: completedAssignments } = await supabase
    .from("job_assignments")
    .select("membership_id, jobs!inner(status)")
    .eq("company_id", context.companyId)
    .eq("jobs.status", "done")
    .in("membership_id", membershipIds);

  const completedCounts = new Map<string, number>();
  (completedAssignments ?? []).forEach((row) => {
    const membershipId = row.membership_id as string;
    completedCounts.set(membershipId, (completedCounts.get(membershipId) ?? 0) + 1);
  });

  return membershipRows.map((membership) => {
    const profile = employeesByUser.get(membership.user_id);
    const status = membership.status === "active" ? "active" : "inactive";
    return {
      id: profile?.id ?? membership.id,
      user_id: membership.user_id,
      full_name: profile?.full_name ?? "",
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: membership.role,
      status,
      membership_id: membership.id,
      created_at: membership.created_at,
      updated_at: profile?.updated_at ?? membership.created_at,
      completed_jobs_count: completedCounts.get(membership.id) ?? 0
    } as Employee & { completed_jobs_count?: number };
  });
}

export type EmployeeWithAvatar = Employee & {
  avatar_signed_url?: string | null;
};

export type EmployeeWithJobs = EmployeeWithAvatar & {
  jobs?: Array<{
    id: string;
    title: string | null;
    status: JobStatus;
    scheduled_for: string;
    customer_name: string | null;
  }>;
};

const toScheduledFor = (date: string, time?: string | null) =>
  `${date}T${time?.slice(0, 5) ?? "00:00"}`;

export async function getEmployeeById(id: string): Promise<EmployeeWithJobs | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, company_id, user_id, full_name, first_name, last_name, email, phone, role, is_active, avatar_url, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const context = await getActiveCompanyContext();
  if (!context || !data.user_id) {
    const fallbackStatus = data.is_active === false ? "inactive" : "active";
    return {
      id: data.id,
      company_id: data.company_id ?? "",
      user_id: data.user_id,
      full_name: data.full_name ?? "",
      first_name: data.first_name ?? "",
      last_name: data.last_name ?? "",
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: (data.role ?? "employee") as Employee["role"],
      avatar_url: data.avatar_url ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at ?? data.created_at,
      status: fallbackStatus,
      membership_id: null
    };
  }

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("id, role, status, created_at")
    .eq("company_id", context.companyId)
    .eq("user_id", data.user_id)
    .maybeSingle();

  const { data: assignmentRows } = await supabase
    .from("job_assignments")
    .select("job_id")
    .eq("membership_id", membership?.id ?? "");

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("id, title, status, scheduled_date, scheduled_time, customer_name")
    .eq("company_id", context.companyId)
    .in(
      "id",
      (assignmentRows ?? []).map((row) => row.job_id)
    );

  let avatarSignedUrl: string | null = null;
  if (data.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("customer-avatars")
      .createSignedUrl(data.avatar_url, 60 * 60);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }

  return {
    id: data.id,
    company_id: data.company_id ?? "",
    user_id: data.user_id,
    full_name: data.full_name ?? "",
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    email: data.email ?? null,
    phone: data.phone ?? null,
    role: (membership?.role ?? data.role ?? "employee") as Employee["role"],
    avatar_url: data.avatar_url ?? null,
    created_at: membership?.created_at ?? data.created_at,
    updated_at: data.updated_at ?? data.created_at,
    status: membership?.status === "active" ? "active" : "inactive",
    membership_id: membership?.id ?? null,
    avatar_signed_url: avatarSignedUrl,
    jobs: (jobRows ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string | null,
      status: row.status as JobStatus,
      scheduled_for: toScheduledFor(
        row.scheduled_date as string,
        row.scheduled_time as string | null
      ),
      customer_name: row.customer_name as string | null
    }))
  };
}

export type EmployeeJobSummary = {
  id: string;
  title: string | null;
  customer_name: string | null;
  status: JobStatus;
  scheduled_for: string;
};

export async function listEmployeeJobs(employeeId: string) {
  const supabase = await createSupabaseServerClient();
  const context = await getActiveCompanyContext();
  if (!context) {
    return [];
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("user_id")
    .eq("id", employeeId)
    .maybeSingle();

  if (!employee?.user_id) {
    return [];
  }

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("id")
    .eq("company_id", context.companyId)
    .eq("user_id", employee.user_id)
    .maybeSingle();

  if (!membership?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, customer_name, status, scheduled_date, scheduled_time, job_assignments!inner(membership_id)"
    )
    .eq("company_id", context.companyId)
    .eq("job_assignments.membership_id", membership.id)
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

type UpdateEmployeeInput = Partial<Employee> & {
  membership_role?: string;
  membership_status?: "active" | "inactive";
};

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
  companyId: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("employees")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!current) {
    return null;
  }

  const { data: updated, error } = await supabase
    .from("employees")
    .update({
      full_name: input.full_name ?? undefined,
      first_name: input.first_name ?? undefined,
      last_name: input.last_name ?? undefined,
      email: input.email ?? undefined,
      phone: input.phone ?? undefined,
      avatar_url: input.avatar_url ?? undefined
    })
    .eq("id", id)
    .select(
      "id, company_id, user_id, full_name, first_name, last_name, email, phone, role, is_active, avatar_url, created_at, updated_at"
    )
    .maybeSingle();

  if (error || !updated) {
    return null;
  }

  if (current.user_id && (input.membership_role || input.membership_status)) {
    await supabase
      .from("company_memberships")
      .update({
        role: input.membership_role,
        status: input.membership_status
      })
      .eq("company_id", companyId)
      .eq("user_id", current.user_id);
  }

  const resolvedStatus =
    input.membership_status ?? (updated.is_active === false ? "inactive" : "active");
  return {
    id: updated.id,
    company_id: companyId,
    user_id: updated.user_id,
    full_name: updated.full_name ?? "",
    first_name: updated.first_name ?? "",
    last_name: updated.last_name ?? "",
    email: updated.email ?? null,
    phone: updated.phone ?? null,
    role: updated.role as Employee["role"],
    avatar_url: updated.avatar_url ?? null,
    created_at: updated.created_at,
    updated_at: updated.updated_at ?? updated.created_at,
    status: resolvedStatus,
    membership_id: null
  };
}

export async function deactivateEmployeeMembership(userId: string, companyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_memberships")
    .update({ status: "inactive" })
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}
