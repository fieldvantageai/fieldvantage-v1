import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import {
  deleteJob,
  getJobById,
  updateJob
} from "@/features/jobs/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
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
    const body = await request.json();
    const input = await newJobSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const supabase = await createSupabaseServerClient();
    const { data: company } = await supabase
      .from("companies")
      .select("id, owner_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!company?.id) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }

    const inactiveIds =
      input.assignedEmployeeIds?.length
        ? (
            await supabase
              .from("employees")
              .select("id")
              .eq("company_id", company.id)
              .in("id", input.assignedEmployeeIds)
              .eq("is_active", false)
          ).data ?? []
        : [];

    const allowInactive = Boolean(input.allowInactive);
    const isOwner = company.owner_id === user.id;
    const isAdmin = !isOwner && user.email
      ? (
          await supabase
            .from("employees")
            .select("role")
            .eq("company_id", company.id)
            .eq("email", user.email)
            .maybeSingle()
        ).data?.role === "admin"
      : false;
    const canAllowInactive = isOwner || isAdmin;

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
  const deleted = await deleteJob(id);
  if (!deleted) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
