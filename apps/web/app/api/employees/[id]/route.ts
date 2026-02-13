import { NextResponse } from "next/server";

import { newEmployeeSchema } from "@/features/employees/forms/newEmployee/formSchema";
import {
  deactivateEmployeeMembership,
  getEmployeeById,
  updateEmployee
} from "@/features/employees/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }
  const employee = await getEmployeeById(id);
  if (!employee) {
    return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
  }
  let avatarSignedUrl: string | null = null;
  if (employee.avatar_url) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.storage
      .from("customer-avatars")
      .createSignedUrl(employee.avatar_url, 60 * 60);
    avatarSignedUrl = data?.signedUrl ?? null;
  }
  return NextResponse.json({ data: { ...employee, avatar_signed_url: avatarSignedUrl } });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const current = await getEmployeeById(id);
    if (!current) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }
    const body = await request.json();
    const input = await newEmployeeSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const normalizeOptional = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const updated = await updateEmployee(
      id,
      {
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
      status: input.status,
      membership_role: input.role,
      membership_status: input.status
      },
      context.companyId
    );

    if (!updated) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    let avatarSignedUrl: string | null = null;
    if (updated.avatar_url) {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.storage
        .from("customer-avatars")
        .createSignedUrl(updated.avatar_url, 60 * 60);
      avatarSignedUrl = data?.signedUrl ?? null;
    }

    return NextResponse.json({
      data: {
        ...updated,
        avatar_signed_url: avatarSignedUrl
      }
    });
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

export async function DELETE(_: Request, { params }: RouteParams) {
  const { id } = await params;
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
  const current = await getEmployeeById(id);
  if (!current) {
    return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
  }

  if (current.user_id) {
    const deactivated = await deactivateEmployeeMembership(
      current.user_id,
      context.companyId
    );
    if (!deactivated) {
      return NextResponse.json(
        { error: "Nao foi possivel desativar o colaborador." },
        { status: 400 }
      );
    }
    return NextResponse.json({ data: { deleted: true } });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
