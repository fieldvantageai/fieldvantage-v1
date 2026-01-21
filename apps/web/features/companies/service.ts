import type { Company } from "@/features/_shared/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateCompanyInput = {
  name?: string;
  industry?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  logo_url?: string | null;
};

export async function getMyCompany(): Promise<Company | null> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMyCompany(input: UpdateCompanyInput) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (companyError) {
    throw companyError;
  }

  if (!company?.id) {
    throw new Error("Empresa nao encontrada.");
  }

  const { data, error } = await supabase
    .from("companies")
    .update(input)
    .eq("id", company.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertMyCompany(input: UpdateCompanyInput & { name: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (companyError) {
    throw companyError;
  }

  if (!company?.id) {
    const { data, error } = await supabase
      .from("companies")
      .insert({
        owner_id: authData.user.id,
        name: input.name,
        industry: input.industry ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address_line1: input.address_line1 ?? null,
        address_line2: input.address_line2 ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zip_code: input.zip_code ?? null,
        country: input.country ?? null,
        logo_url: input.logo_url ?? null
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  return updateMyCompany(input);
}
