import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createCustomer as createCustomerData,
  deleteCustomer as deleteCustomerData,
  getCustomerById as getCustomerByIdData,
  listCustomers as listCustomersData,
  updateCustomer as updateCustomerData,
  type CreateCustomerInput,
  type UpdateCustomerInput
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

export async function listCustomers() {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  return listCustomersData(supabase, companyId);
}

export async function getCustomerById(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }
  return getCustomerByIdData(supabase, companyId, id);
}

export async function createCustomer(input: CreateCustomerInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return createCustomerData(supabase, companyId, input);
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return updateCustomerData(supabase, companyId, id, input);
}

export async function deleteCustomer(id: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return false;
  }
  return deleteCustomerData(supabase, companyId, id);
}
