import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; email?: string };
    const token = body.token?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Token invalido." }, { status: 400 });
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalido." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select("id, status, expires_at, employee:employee_id(id, email)")
      .eq("token_hash", tokenHash)
      .maybeSingle<{
        id: string;
        status: string;
        expires_at: string;
        employee: { id: string; email: string | null } | null;
      }>();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
    if (!inviteData) {
      return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
    }
    if (inviteData.status !== "pending") {
      return NextResponse.json({ error: "Convite expirado ou revogado." }, { status: 410 });
    }
    if (new Date(inviteData.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Convite expirado." }, { status: 410 });
    }

    if (inviteData.employee?.email) {
      return NextResponse.json({ success: true });
    }

    const { error: updateEmployeeError } = await supabaseAdmin
      .from("employees")
      .update({ email })
      .eq("id", inviteData.employee?.id ?? "");

    if (updateEmployeeError) {
      return NextResponse.json({ error: updateEmployeeError.message }, { status: 400 });
    }

    await supabaseAdmin.from("invites").update({ email }).eq("id", inviteData.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
