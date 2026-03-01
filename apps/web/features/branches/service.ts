import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";

export type Branch = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateBranchInput = Omit<Branch, "id" | "company_id" | "created_at" | "updated_at">;
export type UpdateBranchInput = Partial<CreateBranchInput>;

export async function listBranches(): Promise<Branch[]> {
  const context = await getActiveCompanyContext();
  if (!context) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("company_id", context.companyId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const context = await getActiveCompanyContext();
  if (!context) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", id)
    .eq("company_id", context.companyId)
    .maybeSingle();

  if (error) throw error;
  return (data as Branch) ?? null;
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const context = await getActiveCompanyContext();
  if (!context) throw new Error("Empresa nao encontrada.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({
      company_id: context.companyId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address_line1: input.address_line1 ?? null,
      address_line2: input.address_line2 ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip_code: input.zip_code ?? null,
      country: input.country ?? null,
      is_active: input.is_active ?? true
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Erro ao criar filial.");
  return data as Branch;
}

export async function updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
  const context = await getActiveCompanyContext();
  if (!context) throw new Error("Empresa nao encontrada.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .update({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address_line1: input.address_line1,
      address_line2: input.address_line2,
      city: input.city,
      state: input.state,
      zip_code: input.zip_code,
      country: input.country,
      is_active: input.is_active
    })
    .eq("id", id)
    .eq("company_id", context.companyId)
    .select("*")
    .maybeSingle();

  if (error || !data) throw error ?? new Error("Erro ao atualizar filial.");
  return data as Branch;
}

export async function deleteBranch(id: string): Promise<void> {
  const context = await getActiveCompanyContext();
  if (!context) throw new Error("Empresa nao encontrada.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("branches")
    .delete()
    .eq("id", id)
    .eq("company_id", context.companyId);

  if (error) throw error;
}
