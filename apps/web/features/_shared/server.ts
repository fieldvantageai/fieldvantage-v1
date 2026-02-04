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
  return data.user;
}

