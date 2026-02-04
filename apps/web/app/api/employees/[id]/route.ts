import { NextResponse } from "next/server";

import { newEmployeeSchema } from "@/features/employees/forms/newEmployee/formSchema";
import {
  deleteEmployee,
  getEmployeeById,
  updateEmployee
} from "@/features/employees/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  return NextResponse.json({ data: employee });
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
    const updated = await updateEmployee(id, {
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
      status: input.status
    });

    if (!updated) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
    }

    if (updated.email && current.status !== updated.status) {
      const { data } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = data?.users?.find(
        (item) => item.email?.toLowerCase() === updated.email?.toLowerCase()
      );
      if (authUser?.id) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...(authUser.user_metadata ?? {}),
            is_active: updated.status === "active"
          }
        });
      }
    }

    let avatarSignedUrl: string | null = null;
    if (updated.avatar_url) {
      const { data } = await supabaseAdmin.storage
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
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      current.user_id
    );
    if (authDeleteError) {
      return NextResponse.json(
        { error: authDeleteError.message },
        { status: 400 }
      );
    }
  } else if (current.email) {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = data?.users?.find(
      (item) => item.email?.toLowerCase() === current.email?.toLowerCase()
    );
    if (authUser?.id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        authUser.id
      );
      if (authDeleteError) {
        return NextResponse.json(
          { error: authDeleteError.message },
          { status: 400 }
        );
      }
    }
  }

  const deleted = await deleteEmployee(id);
  if (!deleted) {
    return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
