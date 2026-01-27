import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createEmployee as createEmployeeData,
  deleteEmployee as deleteEmployeeData,
  getEmployeeById as getEmployeeByIdData,
  listEmployees as listEmployeesData,
  updateEmployee as updateEmployeeData,
  type CreateEmployeeInput,
  type UpdateEmployeeInput
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

export async function listEmployees() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  return listEmployeesData(supabase, companyId);
}

export async function getEmployeeById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }
  return getEmployeeByIdData(supabase, companyId, id);
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
