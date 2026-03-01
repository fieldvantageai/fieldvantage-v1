import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ValidateInviteSuccess = {
  ok: true;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    logo_signed_url: string | null;
  };
  employee: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  invite: {
    id: string;
    expires_at: string;
  };
};

export type ValidateInviteError = {
  ok: false;
  status: 400 | 404 | 409 | 410 | 500;
  error: string;
};

export type ValidateInviteResult = ValidateInviteSuccess | ValidateInviteError;

export async function validateInviteToken(
  rawToken: string
): Promise<ValidateInviteResult> {
  if (!rawToken || rawToken.length < 32) {
    return { ok: false, status: 400, error: "Token invalido." };
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const { data, error } = await supabaseAdmin
    .from("invites")
    .select(
      "id, expires_at, status, email, employee:employee_id(id, first_name, last_name, email, user_id), company:company_id(id, name, logo_url)"
    )
    .eq("token_hash", tokenHash)
    .maybeSingle<{
      id: string;
      expires_at: string;
      status: string;
      email: string | null;
      employee: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        user_id: string | null;
      } | null;
      company: { id: string; name: string; logo_url: string | null } | null;
    }>();

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  if (!data) {
    return { ok: false, status: 404, error: "Convite nao encontrado." };
  }

  if (data.status !== "pending") {
    if (data.status === "accepted" || data.employee?.user_id) {
      return { ok: false, status: 409, error: "Convite ja aceito." };
    }
    return { ok: false, status: 410, error: "Convite expirado ou revogado." };
  }

  const expiresAt = new Date(data.expires_at);
  if (expiresAt.getTime() <= Date.now()) {
    return { ok: false, status: 410, error: "Convite expirado." };
  }

  let logoSignedUrl: string | null = null;
  if (data.company?.logo_url) {
    const { data: signed } = await supabaseAdmin.storage
      .from("company-logos")
      .createSignedUrl(data.company.logo_url, 60 * 60);
    logoSignedUrl = signed?.signedUrl ?? null;
  }

  return {
    ok: true,
    company: {
      id: data.company?.id ?? "",
      name: data.company?.name ?? "",
      logo_url: data.company?.logo_url ?? null,
      logo_signed_url: logoSignedUrl
    },
    employee: {
      id: data.employee?.id ?? "",
      first_name: data.employee?.first_name ?? null,
      last_name: data.employee?.last_name ?? null,
      email: data.email ?? data.employee?.email ?? null
    },
    invite: {
      id: data.id,
      expires_at: data.expires_at
    }
  };
}
