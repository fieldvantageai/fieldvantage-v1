import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import {
  deleteJob,
  getJobById,
  updateJob
} from "@/features/jobs/service";
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
  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }
  return NextResponse.json({ data: job });
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
    const body = await request.json();
    const input = await newJobSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const supabase = await createSupabaseServerClient();
    const companyId = context.companyId;

    const inactiveIds =
      input.assignedEmployeeIds?.length
        ? (
            await supabase
              .from("employees")
              .select("id")
          .eq("company_id", companyId)
              .in("id", input.assignedEmployeeIds)
              .eq("is_active", false)
          ).data ?? []
        : [];

    const allowInactive = Boolean(input.allowInactive);
    const canAllowInactive = context.role === "owner" || context.role === "admin";

    if (inactiveIds.length > 0 && (!allowInactive || !canAllowInactive)) {
      return NextResponse.json(
        { error: "EMPLOYEE_INACTIVE", message: "Colaborador inativo." },
        { status: 409 }
      );
    }

    const updated = await updateJob(id, {
      title: input.title,
      status: input.status,
      scheduled_for: input.scheduledFor,
      estimated_end_at: input.estimatedEndAt,
      customer_name: input.customerName,
      customer_id: input.customerId || null,
      customer_address_id: input.customerAddressId || null,
      assigned_employee_ids: input.assignedEmployeeIds ?? [],
      allow_inactive_assignments: allowInactive,
      is_recurring: input.isRecurring ?? false,
      recurrence: input.recurrence ?? null,
      notes: input.notes ?? null
    });

    if (!updated) {
      return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
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
  const deleted = await deleteJob(id);
  if (!deleted) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
