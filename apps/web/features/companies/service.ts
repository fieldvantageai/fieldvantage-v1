import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getMyCompany as getMyCompanyData,
  updateMyCompany as updateMyCompanyData,
  upsertMyCompany as upsertMyCompanyData,
  type UpdateCompanyInput
} from "@fieldvantage/data";

export type { UpdateCompanyInput };

export async function getMyCompany() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return null;
  }
  return getMyCompanyData(supabase, authData.user.id);
}

export async function updateMyCompany(input: UpdateCompanyInput) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Usuario nao autenticado.");
  }
  return updateMyCompanyData(supabase, authData.user.id, input);
}

export async function upsertMyCompany(input: UpdateCompanyInput & { name: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Usuario nao autenticado.");
  }
  return upsertMyCompanyData(supabase, authData.user.id, input);
}
