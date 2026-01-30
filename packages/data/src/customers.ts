import type { SupabaseClient } from "@supabase/supabase-js";

import type { Customer } from "@fieldvantage/shared";

type CustomerRow = {
  id: string;
  company_id: string;
  name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
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
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  notes?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  company_id: row.company_id,
  name: row.name,
  first_name: row.first_name,
  last_name: row.last_name,
  avatar_url: row.avatar_url,
  email: row.email,
  phone: row.phone,
  company_name: row.company_name,
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

export type CustomerAddressInput = {
  type: "residential" | "business";
  label?: string | null;
  note?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_primary: boolean;
};

type CustomerAddressRow = CustomerAddressInput & {
  id: string;
  company_id: string;
  customer_id: string;
  created_at: string;
};

export async function listCustomers(
  supabase: SupabaseClient,
  companyId: string
) {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, company_id, name, first_name, last_name, avatar_url, email, phone, company_name, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
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
      "id, company_id, name, first_name, last_name, avatar_url, email, phone, company_name, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
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
  const name = `${input.first_name} ${input.last_name}`.trim();
  const payload = {
    company_id: companyId,
    name,
    first_name: input.first_name,
    last_name: input.last_name,
    avatar_url: input.avatar_url ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    company_name: input.company_name ?? null,
    notes: input.notes ?? null
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select(
      "id, company_id, name, first_name, last_name, avatar_url, email, phone, company_name, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
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
  const name =
    input.first_name || input.last_name
      ? `${input.first_name ?? ""} ${input.last_name ?? ""}`.trim()
      : undefined;
  const payload = {
    name,
    first_name: input.first_name,
    last_name: input.last_name,
    avatar_url: input.avatar_url ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    company_name: input.company_name ?? null,
    notes: input.notes ?? null
  };

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", id)
    .select(
      "id, company_id, name, first_name, last_name, avatar_url, email, phone, company_name, address_line1, address_line2, city, state, zip_code, country, notes, created_at, updated_at"
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

export async function listCustomerAddresses(
  supabase: SupabaseClient,
  companyId: string,
  customerId: string
) {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select(
      "id, company_id, customer_id, type, label, note, address_line1, address_line2, city, state, zip_code, country, is_primary, created_at"
    )
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .order("created_at");

  if (error) {
    throw error;
  }

  return (data ?? []) as CustomerAddressRow[];
}

export async function replaceCustomerAddresses(
  supabase: SupabaseClient,
  companyId: string,
  customerId: string,
  addresses: CustomerAddressInput[]
) {
  await supabase
    .from("customer_addresses")
    .delete()
    .eq("company_id", companyId)
    .eq("customer_id", customerId);

  if (addresses.length === 0) {
    return [];
  }

  const payload = addresses.map((address) => ({
    company_id: companyId,
    customer_id: customerId,
    type: address.type,
    label: address.label ?? null,
    note: address.note ?? null,
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? null,
    city: address.city,
    state: address.state,
    zip_code: address.zip_code,
    country: address.country,
    is_primary: address.is_primary
  }));

  const { data, error } = await supabase
    .from("customer_addresses")
    .insert(payload)
    .select(
      "id, company_id, customer_id, type, label, note, address_line1, address_line2, city, state, zip_code, country, is_primary, created_at"
    );

  if (error) {
    throw error;
  }

  return (data ?? []) as CustomerAddressRow[];
}
