import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token")?.trim() ?? "";

  if (!rawToken || rawToken.length < 32) {
    return NextResponse.json({ error: "Token invalido." }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
  }

  if (data.status !== "pending") {
    if (data.status === "accepted" || data.employee?.user_id) {
      return NextResponse.json({ error: "Convite ja aceito." }, { status: 409 });
    }
    return NextResponse.json({ error: "Convite expirado ou revogado." }, { status: 410 });
  }

  const expiresAt = new Date(data.expires_at);
  if (expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Convite expirado." }, { status: 410 });
  }

  let logoSignedUrl: string | null = null;
  if (data.company?.logo_url) {
    const { data: signed } = await supabaseAdmin.storage
      .from("company-logos")
      .createSignedUrl(data.company.logo_url, 60 * 60);
    logoSignedUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    valid: true,
    company: data.company
      ? {
          id: data.company.id,
          name: data.company.name,
          logo_url: data.company.logo_url ?? null,
          logo_signed_url: logoSignedUrl
        }
      : null,
    employee: data.employee
      ? {
          id: data.employee.id,
          first_name: data.employee.first_name,
          last_name: data.employee.last_name,
          email: data.email ?? data.employee.email ?? null
        }
      : null,
    invite: {
      id: data.id,
      expires_at: data.expires_at
    }
  });
}
