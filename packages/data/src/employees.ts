import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Employee,
  EmployeeRole,
  EmployeeStatus,
  NavigationPreference
} from "@fieldvantage/shared";

type EmployeeRow = {
  id: string;
  company_id: string | null;
  user_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  notes: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  preferred_navigation_app: NavigationPreference | null;
  invitation_status: "pending" | "accepted" | "revoked" | "expired" | null;
  role: EmployeeRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateEmployeeInput = {
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  notes?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  preferred_navigation_app?: NavigationPreference | null;
  role: EmployeeRole;
  status: EmployeeStatus;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

const toEmployee = (
  row: EmployeeRow,
  companyId: string,
  role: EmployeeRole,
  status: EmployeeStatus,
  invitationStatus?: EmployeeRow["invitation_status"]
): Employee => ({
  id: row.id,
  company_id: companyId,
  user_id: row.user_id,
  first_name: row.first_name,
  last_name: row.last_name,
  full_name: row.full_name,
  avatar_url: row.avatar_url,
  email: row.email,
  phone: row.phone,
  job_title: row.job_title,
  notes: row.notes,
  address_line1: row.address_line1,
  address_line2: row.address_line2,
  city: row.city,
  state: row.state,
  zip_code: row.zip_code,
  country: row.country,
  preferred_navigation_app: row.preferred_navigation_app,
  invitation_status: invitationStatus ?? row.invitation_status,
  role,
  status,
  created_at: row.created_at,
  updated_at: row.updated_at
});

export async function listEmployees(
  supabase: SupabaseClient,
  companyId: string
) {
  const { data: memberships, error: membershipError } = await supabase
    .from("company_memberships")
    .select("user_id, role, status")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (membershipError) {
    throw membershipError;
  }

  const membershipMap = new Map(
    (memberships ?? [])
      .filter((item) => item.user_id)
      .map((item) => [
        item.user_id as string,
        { role: item.role as EmployeeRole, status: "active" as EmployeeStatus }
      ])
  );

  const userIds = Array.from(membershipMap.keys());

  const { data: employees, error } = userIds.length
    ? await supabase
        .from("employees")
        .select(
          "id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at"
        )
        .in("user_id", userIds)
        .order("full_name")
    : { data: [], error: null };

  if (error) {
    throw error;
  }

  const activeEmployees = (employees ?? [])
    .map((row) => {
      const meta = row.user_id ? membershipMap.get(row.user_id) : null;
      if (!meta) {
        return null;
      }
      return toEmployee(row, companyId, meta.role, meta.status);
    })
    .filter(Boolean) as Employee[];

  const { data: pendingInvites, error: inviteError } = await supabase
    .from("invites")
    .select(
      "employee:employee_id(id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at)"
    )
    .eq("company_id", companyId)
    .eq("status", "pending");

  if (inviteError) {
    throw inviteError;
  }

  const invitedEmployees = (pendingInvites ?? [])
    .map((row) => {
      const employee = Array.isArray(row.employee)
        ? row.employee[0]
        : row.employee;
      return employee as EmployeeRow | null;
    })
    .filter((row): row is EmployeeRow => Boolean(row))
    .map((row) =>
      toEmployee(row, companyId, row.role, "active", "pending")
    );

  const seen = new Set(activeEmployees.map((employee) => employee.id));
  invitedEmployees.forEach((employee) => {
    if (!seen.has(employee.id)) {
      activeEmployees.push(employee);
    }
  });

  return activeEmployees;
}

export async function getEmployeeById(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  if (data.user_id) {
    const { data: membership } = await supabase
      .from("company_memberships")
      .select("role, status")
      .eq("company_id", companyId)
      .eq("user_id", data.user_id)
      .eq("status", "active")
      .maybeSingle();
    if (membership) {
      return toEmployee(
        data,
        companyId,
        membership.role as EmployeeRole,
        "active"
      );
    }
  }

  const { data: pendingInvite } = await supabase
    .from("invites")
    .select("role, status")
    .eq("company_id", companyId)
    .eq("employee_id", data.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingInvite) {
    const inviteRole = (pendingInvite.role ?? data.role) as EmployeeRole;
    return toEmployee(data, companyId, inviteRole, "active", "pending");
  }

  if (data.company_id !== companyId) {
    return null;
  }

  return toEmployee(data, companyId, data.role, data.is_active ? "active" : "inactive");
}

export async function createEmployee(
  supabase: SupabaseClient,
  companyId: string,
  input: CreateEmployeeInput
) {
  if (input.email) {
    const { data: existing, error: existingError } = await supabase
      .from("employees")
      .select(
        "id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at"
      )
      .ilike("email", input.email)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("employees")
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          full_name: input.full_name,
          avatar_url: input.avatar_url ?? existing.avatar_url,
          phone: input.phone ?? existing.phone,
          job_title: input.job_title ?? existing.job_title,
          notes: input.notes ?? existing.notes,
          address_line1: input.address_line1 ?? existing.address_line1,
          address_line2: input.address_line2 ?? existing.address_line2,
          city: input.city ?? existing.city,
          state: input.state ?? existing.state,
          zip_code: input.zip_code ?? existing.zip_code,
          country: input.country ?? existing.country,
          preferred_navigation_app:
            input.preferred_navigation_app ?? existing.preferred_navigation_app
        })
        .eq("id", existing.id)
        .select(
          "id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at"
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      return toEmployee(
        updated,
        companyId,
        input.role,
        input.status === "active" ? "active" : "inactive"
      );
    }
  }

  const payload = {
    company_id: companyId,
    first_name: input.first_name,
    last_name: input.last_name,
    full_name: input.full_name,
    avatar_url: input.avatar_url ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    job_title: input.job_title ?? null,
    notes: input.notes ?? null,
    address_line1: input.address_line1 ?? null,
    address_line2: input.address_line2 ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zip_code: input.zip_code ?? null,
    country: input.country ?? null,
    preferred_navigation_app: input.preferred_navigation_app ?? null,
    role: input.role,
    is_active: input.status === "active"
  };

  const { data, error } = await supabase
    .from("employees")
    .insert(payload)
    .select(
      "id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return toEmployee(
    data,
    companyId,
    input.role,
    input.status === "active" ? "active" : "inactive"
  );
}

export async function updateEmployee(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
  input: UpdateEmployeeInput
) {
  const payload: Partial<EmployeeRow> = {
    first_name: input.first_name,
    last_name: input.last_name,
    full_name: input.full_name,
    avatar_url: input.avatar_url ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    job_title: input.job_title ?? null,
    notes: input.notes ?? null,
    address_line1: input.address_line1 ?? null,
    address_line2: input.address_line2 ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zip_code: input.zip_code ?? null,
    country: input.country ?? null,
    preferred_navigation_app: input.preferred_navigation_app ?? null,
    role: input.role,
    is_active: input.status ? input.status === "active" : undefined
  };

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .select(
      "id, company_id, user_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, preferred_navigation_app, invitation_status, role, is_active, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? toEmployee(data, companyId, data.role, data.is_active ? "active" : "inactive")
    : null;
}

export async function deleteEmployee(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}
