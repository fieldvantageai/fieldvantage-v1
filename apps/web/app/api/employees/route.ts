import { NextResponse } from "next/server";
import crypto from "crypto";

import { newEmployeeSchema } from "@/features/employees/forms/newEmployee/formSchema";
import { listEmployees } from "@/features/employees/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildInviteLink } from "@/lib/url";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }
  const employees = await listEmployees();
  return NextResponse.json({ data: employees });
}

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
    // Pré-validação do role para guards antes do schema validate
    const rawRole = (body as { role?: string }).role;

    // Ninguem pode convidar como proprietario via convite
    if (rawRole === "owner") {
      return NextResponse.json(
        { error: "Nao e possivel convidar alguem como proprietario." },
        { status: 403 }
      );
    }

    // Admin de filial nao pode convidar como administrador
    if (rawRole === "admin" && context.role === "admin" && !context.isHq) {
      return NextResponse.json(
        { error: "Administradores de filial nao podem convidar como administrador." },
        { status: 403 }
      );
    }
    const input = await newEmployeeSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const normalizeOptional = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const supabase = await createSupabaseServerClient();
    const normalizedEmail = normalizeOptional(input.email);
    const existingEmployee = normalizedEmail
      ? (
          await supabase
            .from("employees")
            .select(
              "id, company_id, first_name, last_name, full_name, email, phone, role, is_active, invitation_status, user_id"
            )
            .ilike("email", normalizedEmail)
            .maybeSingle()
        ).data
      : null;

    const { data: employee, error: employeeError } = existingEmployee
      ? { data: existingEmployee, error: null }
      : await supabase
          .from("employees")
          .insert({
            company_id: context.companyId,
            first_name: input.firstName,
            last_name: input.lastName,
            full_name: fullName,
            avatar_url: normalizeOptional(input.avatarUrl),
            email: normalizedEmail,
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
            "id, company_id, first_name, last_name, full_name, email, phone, role, is_active, invitation_status, user_id"
          )
          .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: employeeError?.message ?? "Erro ao criar colaborador." },
        { status: 400 }
      );
    }

    // Guard multi-filial: admin com filiais só pode convidar para suas filiais
    const inputBranchIds: string[] = (input as { branchIds?: string[] | null }).branchIds ?? [];
    if (!context.isHq && context.branchIds.length > 0) {
      const forbidden = inputBranchIds.filter((bid) => !context.branchIds.includes(bid));
      if (forbidden.length > 0) {
        return NextResponse.json(
          { error: "Voce so pode convidar funcionarios para suas filiais." },
          { status: 403 }
        );
      }
    }

    // Se o admin de filial não especificou branchIds, herda as suas
    const resolvedBranchIds =
      inputBranchIds.length > 0
        ? inputBranchIds
        : context.isHq
          ? []
          : context.branchIds;
    const resolvedBranchId = resolvedBranchIds[0] ?? null;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await supabase
      .from("invites")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("employee_id", employee.id)
      .eq("status", "pending");

    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .insert({
        company_id: context.companyId,
        employee_id: employee.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        created_by: user.id,
        email: employee.email ?? null,
        full_name: employee.full_name ?? null,
        role: employee.role ?? null,
        branch_id: resolvedBranchId,
        branch_ids: resolvedBranchIds.length > 0 ? resolvedBranchIds : null
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
    let existingUserNotice: string | null = null;
    if (employee.user_id) {
      existingUserNotice =
        "Usuario ja possui conta. Ele sera notificado no app.";
    }

    return NextResponse.json(
      {
        employee,
        invite,
        invite_link: inviteLink,
        existing_user_notified: Boolean(existingUserNotice),
        notice: existingUserNotice
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
