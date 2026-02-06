import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type MessageDto = {
  id: string;
  company_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  content: string;
  read_at?: string | null;
  created_at: string;
};

export async function listMessages(withUserId: string) {
  const supabase = await createSupabaseServerClient();
  const context = await getActiveCompanyContext();
  if (!context) {
    return [];
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, company_id, sender_user_id, recipient_user_id, content, read_at, created_at"
    )
    .eq("company_id", context.companyId)
    .or(
      `and(sender_user_id.eq.${user.id},recipient_user_id.eq.${withUserId}),and(sender_user_id.eq.${withUserId},recipient_user_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageDto[];
}

export async function sendMessage(
  recipientUserId: string,
  content: string
) {
  const supabase = await createSupabaseServerClient();
  const context = await getActiveCompanyContext();
  if (!context) {
    throw new Error("Empresa nao encontrada.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Nao autenticado.");
  }

  const { data: membership } = await supabaseAdmin
    .from("company_memberships")
    .select("user_id")
    .eq("company_id", context.companyId)
    .eq("user_id", recipientUserId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    throw new Error("Colaborador nao encontrado.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      company_id: context.companyId,
      sender_user_id: user.id,
      recipient_user_id: recipientUserId,
      content: content.trim()
    })
    .select(
      "id, company_id, sender_user_id, recipient_user_id, content, read_at, created_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as MessageDto;
}
