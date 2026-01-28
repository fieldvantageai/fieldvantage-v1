import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createCustomer as createCustomerData,
  deleteCustomer as deleteCustomerData,
  getCustomerById as getCustomerByIdData,
  listCustomers as listCustomersData,
  listCustomerAddresses as listCustomerAddressesData,
  replaceCustomerAddresses as replaceCustomerAddressesData,
  updateCustomer as updateCustomerData,
  type CreateCustomerInput,
  type CustomerAddressInput,
  type UpdateCustomerInput
} from "@fieldvantage/data";
import type { Customer, CustomerAddress } from "@fieldvantage/shared";

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

export type CustomerWithAddresses = Customer & {
  addresses: CustomerAddress[];
  avatar_signed_url?: string | null;
};

export async function getCustomerById(id: string): Promise<CustomerWithAddresses | null> {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return null;
  }
  const customer = await getCustomerByIdData(supabase, companyId, id);
  if (!customer) {
    return null;
  }
  const addresses = (await listCustomerAddressesData(
    supabase,
    companyId,
    id
  )) as CustomerAddress[];
  let avatarSignedUrl: string | null = null;
  if (customer.avatar_url) {
    const { data } = await supabaseAdmin.storage
      .from("customer-avatars")
      .createSignedUrl(customer.avatar_url, 60 * 60);
    avatarSignedUrl = data?.signedUrl ?? null;
  }
  return {
    ...customer,
    addresses,
    avatar_signed_url: avatarSignedUrl
  };
}

export async function listCustomerAddresses(customerId: string) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    return [];
  }
  return listCustomerAddressesData(supabase, companyId, customerId);
}

export async function replaceCustomerAddresses(
  customerId: string,
  addresses: CustomerAddressInput[]
) {
  const supabase = await createSupabaseServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) {
    throw new Error("Empresa nao encontrada.");
  }
  return replaceCustomerAddressesData(supabase, companyId, customerId, addresses);
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
