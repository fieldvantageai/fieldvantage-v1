import type { SupabaseClient } from "@supabase/supabase-js";

import type { Employee, EmployeeRole, EmployeeStatus } from "@fieldvantage/shared";

type EmployeeRow = {
  id: string;
  company_id: string;
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
  role: EmployeeRole;
  status: EmployeeStatus;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

const toEmployee = (row: EmployeeRow): Employee => ({
  id: row.id,
  company_id: row.company_id,
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
  role: row.role,
  status: row.is_active ? "active" : "inactive",
  created_at: row.created_at,
  updated_at: row.updated_at
});

export async function listEmployees(
  supabase: SupabaseClient,
  companyId: string
) {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, company_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, role, is_active, created_at, updated_at"
    )
    .eq("company_id", companyId)
    .order("full_name");

  if (error) {
    throw error;
  }

  return (data ?? []).map(toEmployee);
}

export async function getEmployeeById(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, company_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, role, is_active, created_at, updated_at"
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toEmployee(data) : null;
}

export async function createEmployee(
  supabase: SupabaseClient,
  companyId: string,
  input: CreateEmployeeInput
) {
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
    role: input.role,
    is_active: input.status === "active"
  };

  const { data, error } = await supabase
    .from("employees")
    .insert(payload)
    .select(
      "id, company_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, role, is_active, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return toEmployee(data);
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
    role: input.role,
    is_active: input.status ? input.status === "active" : undefined
  };

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, first_name, last_name, full_name, avatar_url, email, phone, job_title, notes, address_line1, address_line2, city, state, zip_code, country, role, is_active, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toEmployee(data) : null;
}

export async function deleteEmployee(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}
