import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Employee, EmployeeRole, JobStatus } from "@fieldvantage/shared";

/**
 * O banco armazena "member" em company_memberships, mas a UI usa "employee".
 * Estes helpers mantêm ambas as camadas consistentes.
 */
const dbRoleToUiRole = (dbRole: string): EmployeeRole => {
  if (dbRole === "member") return "employee";
  return dbRole as EmployeeRole;
};

const uiRoleToDbRole = (uiRole: string): string => {
  if (uiRole === "employee") return "member";
  return uiRole;
};

type MembershipRow = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  branch_id: string | null;
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

  // Busca todas as memberships da empresa — RLS (viewer_can_see_membership) filtra por filial automaticamente
  const { data: memberships, error } = await supabase
    .from("company_memberships")
    .select("id, user_id, role, status, branch_id, created_at")
    .eq("company_id", context.companyId);

  if (error || !memberships?.length) {
    return [];
  }

  const membershipRows = memberships as MembershipRow[];
  const membershipIds = membershipRows.map((m) => m.id);

  // Busca vínculos de filial e nomes de branches em paralelo
  const [{ data: mbRows }, { data: companyBranches }] = await Promise.all([
    supabaseAdmin
      .from("membership_branches")
      .select("membership_id, branch_id")
      .in("membership_id", membershipIds),
    supabaseAdmin
      .from("branches")
      .select("id, name")
      .eq("company_id", context.companyId)
  ]);

  const branchIdsMap = new Map<string, string[]>();
  (mbRows ?? []).forEach((row) => {
    const list = branchIdsMap.get(row.membership_id as string) ?? [];
    list.push(row.branch_id as string);
    branchIdsMap.set(row.membership_id as string, list);
  });

  const branchNamesById = new Map<string, string>();
  (companyBranches ?? []).forEach((b) => {
    branchNamesById.set(b.id as string, b.name as string);
  });

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
    if (!userId) return;
    const existing = employeesByUser.get(userId);
    if (!existing) {
      employeesByUser.set(userId, row as EmployeeRow);
      return;
    }
    employeesByUser.set(userId, pickNewestEmployee([existing, row as EmployeeRow]));
  });

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

  type EmployeeListItem = Employee & {
    completed_jobs_count?: number;
    branch_id?: string | null;
    branch_ids?: string[];
    branch_names?: string[];
    membership_raw_role?: string;
    /** "pending" quando o colaborador ainda não aceitou o convite. */
    invitation_status?: "pending" | "accepted" | null;
  };

  const result: EmployeeListItem[] = membershipRows.map((membership) => {
    const profile = employeesByUser.get(membership.user_id);
    const status = membership.status === "active" ? "active" : "inactive";
    const memberBranchIds = branchIdsMap.get(membership.id) ??
      (membership.branch_id ? [membership.branch_id] : []);

    return {
      id: profile?.id ?? membership.id,
      user_id: membership.user_id,
      full_name: profile?.full_name ?? "",
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: dbRoleToUiRole(membership.role),
      membership_raw_role: membership.role,
      status,
      invitation_status: "accepted",
      membership_id: membership.id,
      branch_id: membership.branch_id ?? null,
      branch_ids: memberBranchIds,
      branch_names: memberBranchIds.map((bid) => branchNamesById.get(bid) ?? "").filter(Boolean),
      created_at: membership.created_at,
      updated_at: profile?.updated_at ?? membership.created_at,
      completed_jobs_count: completedCounts.get(membership.id) ?? 0
    } as EmployeeListItem;
  });

  // Inclui colaboradores com convites pendentes (ainda não aceitaram)
  const { data: pendingInvites } = await supabaseAdmin
    .from("invites")
    .select("id, employee_id, branch_id, branch_ids, role, created_at")
    .eq("company_id", context.companyId)
    .eq("status", "pending");

  if (pendingInvites && pendingInvites.length > 0) {
    // Mantém apenas o convite mais recente por colaborador
    const latestByEmployee = new Map<string, typeof pendingInvites[0]>();
    for (const inv of pendingInvites) {
      if (!inv.employee_id) continue;
      const existing = latestByEmployee.get(inv.employee_id as string);
      if (!existing || new Date(inv.created_at as string) > new Date(existing.created_at as string)) {
        latestByEmployee.set(inv.employee_id as string, inv);
      }
    }

    // IDs de colaboradores já representados por membership
    const activeEmployeeIds = new Set(result.map((e) => e.id));

    const pendingEmpIds = [...latestByEmployee.keys()];
    if (pendingEmpIds.length > 0) {
      const { data: pendingEmpRows } = await supabaseAdmin
        .from("employees")
        .select(
          "id, user_id, full_name, first_name, last_name, email, phone, role, is_active, avatar_url, created_at, updated_at"
        )
        .in("id", pendingEmpIds);

      for (const emp of pendingEmpRows ?? []) {
        // Pula se já está na lista (ex: aceitou convite após query de memberships)
        if (activeEmployeeIds.has(emp.id as string)) continue;
        // Pula se já aceitou (user_id preenchido mas membership não capturada — raro)
        if (emp.user_id) continue;

        const invite = latestByEmployee.get(emp.id as string);
        const inviteBranchIds: string[] =
          invite?.branch_ids && (invite.branch_ids as string[]).length > 0
            ? (invite.branch_ids as string[])
            : invite?.branch_id
              ? [invite.branch_id as string]
              : [];

        const inviteRole = (invite?.role as string | null | undefined) ?? (emp.role as string | null | undefined) ?? "employee";

        result.push({
          id: emp.id as string,
          user_id: null,
          full_name: (emp.full_name as string | null) ?? "",
          first_name: (emp.first_name as string | null) ?? "",
          last_name: (emp.last_name as string | null) ?? "",
          email: (emp.email as string | null) ?? null,
          phone: (emp.phone as string | null) ?? null,
          avatar_url: (emp.avatar_url as string | null) ?? null,
          role: dbRoleToUiRole(inviteRole),
          membership_raw_role: inviteRole,
          status: "active",
          invitation_status: "pending",
          membership_id: null,
          branch_id: inviteBranchIds[0] ?? null,
          branch_ids: inviteBranchIds,
          branch_names: inviteBranchIds.map((bid) => branchNamesById.get(bid) ?? "").filter(Boolean),
          created_at: emp.created_at as string,
          updated_at: ((emp.updated_at as string | null) ?? emp.created_at) as string,
          completed_jobs_count: 0
        } as EmployeeListItem);
      }
    }
  }

  return result;
}

export type EmployeeWithAvatar = Employee & {
  avatar_signed_url?: string | null;
  branch_id?: string | null;
  branch_ids?: string[];
  branch_names?: string[];
  /** Role cru do banco (company_memberships.role). Usado para guards de promocao. */
  membership_raw_role?: string;
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
  if (!context) {
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
      membership_id: null,
      branch_id: null,
      branch_ids: [],
      branch_names: []
    };
  }

  // Colaborador pendente (convite não aceito): lê filiais do convite mais recente
  if (!data.user_id) {
    const fallbackStatus = data.is_active === false ? "inactive" : "active";

    const { data: pendingInvite } = await supabaseAdmin
      .from("invites")
      .select("branch_id, branch_ids, role")
      .eq("employee_id", data.id)
      .eq("company_id", context.companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const inviteBranchIds: string[] =
      pendingInvite?.branch_ids && (pendingInvite.branch_ids as string[]).length > 0
        ? (pendingInvite.branch_ids as string[])
        : pendingInvite?.branch_id
          ? [pendingInvite.branch_id as string]
          : [];

    let inviteBranchNames: string[] = [];
    if (inviteBranchIds.length > 0) {
      const { data: branchRows } = await supabaseAdmin
        .from("branches")
        .select("id, name")
        .in("id", inviteBranchIds);
      inviteBranchNames = (branchRows ?? []).map((b) => b.name as string);
    }

    const pendingRole = (pendingInvite?.role as string | null | undefined) ?? data.role ?? "employee";

    return {
      id: data.id,
      company_id: data.company_id ?? "",
      user_id: data.user_id,
      full_name: data.full_name ?? "",
      first_name: data.first_name ?? "",
      last_name: data.last_name ?? "",
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: dbRoleToUiRole(pendingRole) as Employee["role"],
      membership_raw_role: pendingRole,
      avatar_url: data.avatar_url ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at ?? data.created_at,
      status: fallbackStatus,
      membership_id: null,
      branch_id: inviteBranchIds[0] ?? null,
      branch_ids: inviteBranchIds,
      branch_names: inviteBranchNames
    };
  }

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("id, role, status, branch_id, created_at")
    .eq("company_id", context.companyId)
    .eq("user_id", data.user_id)
    .maybeSingle();

  // Busca branch_ids e nomes de branches
  let branchIds: string[] = [];
  let branchNames: string[] = [];
  if (membership?.id) {
    const { data: mbRows } = await supabaseAdmin
      .from("membership_branches")
      .select("branch_id")
      .eq("membership_id", membership.id);
    branchIds = mbRows?.map((r) => r.branch_id as string) ?? [];
    // Fallback legado
    if (branchIds.length === 0 && membership.branch_id) {
      branchIds = [membership.branch_id];
    }
    if (branchIds.length > 0) {
      const { data: branchRows } = await supabaseAdmin
        .from("branches")
        .select("id, name")
        .in("id", branchIds);
      branchNames = (branchRows ?? []).map((b) => b.name as string);
    }
  }

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
    const { data: signed } = await supabaseAdmin.storage
      .from("customer-avatars")
      .createSignedUrl(data.avatar_url, 60 * 60);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }

  const resolvedDbRole = membership?.role ?? data.role ?? "employee";
  return {
    id: data.id,
    company_id: data.company_id ?? "",
    user_id: data.user_id,
    full_name: data.full_name ?? "",
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    email: data.email ?? null,
    phone: data.phone ?? null,
    role: dbRoleToUiRole(resolvedDbRole) as Employee["role"],
    membership_raw_role: resolvedDbRole,
    avatar_url: data.avatar_url ?? null,
    created_at: membership?.created_at ?? data.created_at,
    updated_at: data.updated_at ?? data.created_at,
    status: membership?.status === "active" ? "active" : "inactive",
    membership_id: membership?.id ?? null,
    branch_id: membership?.branch_id ?? null,
    branch_ids: branchIds,
    branch_names: branchNames,
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

export type UpdateEmployeeInput = Partial<Employee> & {
  membership_role?: string;
  membership_status?: "active" | "inactive";
  /** Array de branch_ids. Substitui completamente membership_branches. */
  membership_branch_ids?: string[];
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

  const normalizedInputEmail = input.email?.trim().toLowerCase() ?? null;
  const shouldSyncAuthEmail = !!current.user_id && !!normalizedInputEmail;

  // Se o colaborador já aceitou convite (tem user_id), o login depende de auth.users.email.
  // Sincronizamos antes para falhar cedo em caso de email inválido/duplicado.
  if (shouldSyncAuthEmail) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      current.user_id as string,
      {
        email: normalizedInputEmail,
        email_confirm: true
      }
    );

    if (authUpdateError) {
      throw new Error(authUpdateError.message);
    }
  }

  const { data: updated, error } = await supabase
    .from("employees")
    .update({
      full_name: input.full_name ?? undefined,
      first_name: input.first_name ?? undefined,
      last_name: input.last_name ?? undefined,
      email: normalizedInputEmail ?? input.email ?? undefined,
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

  // Para colaboradores pendentes (sem user_id), atualizar branch_ids no convite ativo
  if (!current.user_id && input.membership_branch_ids !== undefined) {
    const newBranchIds = input.membership_branch_ids;
    const primaryBranchId = newBranchIds[0] ?? null;
    await supabaseAdmin
      .from("invites")
      .update({
        branch_id: primaryBranchId,
        branch_ids: newBranchIds.length > 0 ? newBranchIds : null
      })
      .eq("employee_id", id)
      .eq("status", "pending");
  }

  if (current.user_id) {
    // Busca membership para obter o id
    const { data: membership } = await supabaseAdmin
      .from("company_memberships")
      .select("id, branch_id")
      .eq("company_id", companyId)
      .eq("user_id", current.user_id)
      .maybeSingle();

    if (membership) {
      // Determina a branch primária (legado) a partir de membership_branch_ids
      const newBranchIds = input.membership_branch_ids;
      const primaryBranchId = newBranchIds !== undefined
        ? (newBranchIds[0] ?? null)
        : membership.branch_id;

      // Atualiza campos em company_memberships
      const membershipUpdates: Record<string, unknown> = {};
      if (input.membership_role) {
        membershipUpdates.role = uiRoleToDbRole(input.membership_role);
      }
      if (input.membership_status) {
        membershipUpdates.status = input.membership_status;
      }
      if (newBranchIds !== undefined) {
        membershipUpdates.branch_id = primaryBranchId;
      }
      if (Object.keys(membershipUpdates).length > 0) {
        await supabaseAdmin
          .from("company_memberships")
          .update(membershipUpdates)
          .eq("id", membership.id);
      }

      // Sincroniza membership_branches (substitui completamente)
      if (newBranchIds !== undefined) {
        await supabaseAdmin
          .from("membership_branches")
          .delete()
          .eq("membership_id", membership.id);

        if (newBranchIds.length > 0) {
          await supabaseAdmin
            .from("membership_branches")
            .insert(
              newBranchIds.map((bid) => ({
                membership_id: membership.id,
                branch_id: bid
              }))
            );
        }
      }
    }
  }

  const resolvedStatus =
    input.membership_status ?? (updated.is_active === false ? "inactive" : "active");
  const resolvedRole = input.membership_role
    ? (dbRoleToUiRole(uiRoleToDbRole(input.membership_role)) as Employee["role"])
    : dbRoleToUiRole(updated.role ?? "employee") as Employee["role"];

  return {
    id: updated.id,
    company_id: companyId,
    user_id: updated.user_id,
    full_name: updated.full_name ?? "",
    first_name: updated.first_name ?? "",
    last_name: updated.last_name ?? "",
    email: updated.email ?? null,
    phone: updated.phone ?? null,
    role: resolvedRole,
    avatar_url: updated.avatar_url ?? null,
    created_at: updated.created_at,
    updated_at: updated.updated_at ?? updated.created_at,
    status: resolvedStatus,
    membership_id: null,
    branch_ids: input.membership_branch_ids ?? []
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
