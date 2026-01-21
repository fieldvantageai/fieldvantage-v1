import type { Employee } from "@/features/_shared/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EmployeeRow = {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: "owner" | "admin" | "employee";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateEmployeeInput = {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: "owner" | "admin" | "employee";
  status: "active" | "inactive";
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

const toEmployee = (row: EmployeeRow): Employee => ({
  id: row.id,
  company_id: row.company_id,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  status: row.is_active ? "active" : "inactive",
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

export async function listEmployees() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  const { data, error } = await supabase
    .from("employees")
    .select("id, company_id, full_name, email, phone, role, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .order("full_name");

  if (error) {
    throw error;
  }

  return (data ?? []).map(toEmployee);
}

export async function getEmployeeById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id, company_id, full_name, email, phone, role, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toEmployee(data) : null;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const payload = {
    company_id: companyId,
    full_name: input.full_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    role: input.role,
    is_active: input.status === "active"
  };

  const { data, error } = await supabase
    .from("employees")
    .insert(payload)
    .select("id, company_id, full_name, email, phone, role, is_active, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return toEmployee(data);
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }

  const payload: Partial<EmployeeRow> = {
    full_name: input.full_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    role: input.role,
    is_active: input.status ? input.status === "active" : undefined
  };

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", id)
    .select("id, company_id, full_name, email, phone, role, is_active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toEmployee(data) : null;
}

export async function deleteEmployee(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return false;
  }
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
