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
import type { Employee } from "@fieldvantage/shared";

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

export async function listEmployees() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  return listEmployeesData(supabase, companyId);
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
