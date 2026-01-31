import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSupabaseServer() {
  return createSupabaseServerClient();
}

export async function getSupabaseAuthUser() {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  if (!data.user) {
    return null;
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (employeeError || !employee) {
    return null;
  }
  if (!employee.is_active) {
    return null;
  }

  return data.user;
}

export async function getOwnerCompanyId() {
  const supabase = await getSupabaseServer();
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
}
