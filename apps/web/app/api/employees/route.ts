import { NextResponse } from "next/server";
import crypto from "crypto";

import { newEmployeeSchema } from "@/features/employees/forms/newEmployee/formSchema";
import { listEmployees } from "@/features/employees/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }
  const employees = await listEmployees();
  return NextResponse.json({ data: employees });
}

const buildInviteLink = (request: Request, rawToken: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/invite/accept?token=${rawToken}`;
};

export async function POST(request: Request) {
  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const context = await getActiveCompanyContext();
    if (!context) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }
    if (context.role === "member") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const body = await request.json();
    const input = await newEmployeeSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const normalizeOptional = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert({
        company_id: context.companyId,
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: fullName,
        avatar_url: normalizeOptional(input.avatarUrl),
        email: normalizeOptional(input.email),
        phone: normalizeOptional(input.phone),
        job_title: normalizeOptional(input.jobTitle),
        notes: normalizeOptional(input.notes),
        address_line1: normalizeOptional(input.addressLine1),
        address_line2: normalizeOptional(input.addressLine2),
        city: normalizeOptional(input.city),
        state: normalizeOptional(input.state),
        zip_code: normalizeOptional(input.zipCode),
        country: normalizeOptional(input.country) ?? "USA",
        role: input.role,
        is_active: input.status === "active",
        user_id: null,
        invitation_status: "pending"
      })
      .select(
        "id, company_id, first_name, last_name, full_name, email, phone, role, is_active, invitation_status"
      )
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: employeeError?.message ?? "Erro ao criar colaborador." },
        { status: 400 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("employee_id", employee.id)
      .eq("status", "pending");

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .insert({
        company_id: context.companyId,
        employee_id: employee.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        created_by: user.id
      })
      .select("id, status, expires_at")
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: inviteError?.message ?? "Erro ao criar convite." },
        { status: 400 }
      );
    }

    const inviteLink = buildInviteLink(request, rawToken);

    return NextResponse.json(
      {
        employee,
        invite,
        invite_link: inviteLink
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dados invalidos."
      },
      { status: 400 }
    );
  }
}
