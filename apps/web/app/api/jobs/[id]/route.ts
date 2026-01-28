import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import {
  deleteJob,
  getJobById,
  updateJob
} from "@/features/jobs/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";

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
    const updated = await updateJob(id, {
      title: input.title,
      status: input.status,
      scheduled_for: input.scheduledFor,
      estimated_end_at: input.estimatedEndAt,
      customer_name: input.customerName,
      customer_id: input.customerId || null,
      assigned_employee_ids: input.assignedEmployeeIds ?? [],
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
