import type { SupabaseClient } from "@supabase/supabase-js";

import type { Customer } from "@fieldvantage/shared";

type CustomerRow = {
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
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCustomerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  company_id: row.company_id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address_line1,
  address_line1: row.address_line1,
  address_line2: row.address_line2,
  city: row.city,
  state: row.state,
  zip_code: row.zip_code,
  country: row.country,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at
});

export async function listCustomers(
  supabase: SupabaseClient,
  companyId: string
) {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, company_id, name, email, phone, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
    )
    .eq("company_id", companyId)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map(toCustomer);
}

export async function getCustomerById(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, company_id, name, email, phone, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toCustomer(data) : null;
}

export async function createCustomer(
  supabase: SupabaseClient,
  companyId: string,
  input: CreateCustomerInput
) {
  const payload = {
    company_id: companyId,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address_line1: input.address ?? null
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select(
      "id, company_id, name, email, phone, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return toCustomer(data);
}

export async function updateCustomer(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
  input: UpdateCustomerInput
) {
  const payload = {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address_line1: input.address ?? null
  };

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, name, email, phone, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toCustomer(data) : null;
}

export async function deleteCustomer(
  supabase: SupabaseClient,
  companyId: string,
  id: string
) {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}
