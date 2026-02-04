import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UpdateCompanyInput } from "@fieldvantage/data";

export type { UpdateCompanyInput };

export async function getMyCompany() {
  const supabase = await createSupabaseServerClient();
  const context = await getActiveCompanyContext();
  if (!context) {
    return null;
  }
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", context.companyId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function updateMyCompany(input: UpdateCompanyInput) {
  const supabase = await createSupabaseServerClient();
  const context = await getActiveCompanyContext();
  if (!context) {
    throw new Error("Empresa nao encontrada.");
  }
  if (context.role === "member") {
    throw new Error("Sem permissao para editar empresa.");
  }
  const { data, error } = await supabase
    .from("companies")
    .update(input)
    .eq("id", context.companyId)
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return data;
}
