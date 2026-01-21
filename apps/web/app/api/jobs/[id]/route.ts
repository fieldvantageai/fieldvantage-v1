import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import {
  deleteJob,
  getJobById,
  updateJob
} from "@/features/jobs/mock";

type RouteParams = {
  params: { id: string };
};

export async function GET(_: Request, { params }: RouteParams) {
  const job = await getJobById(params.id);
  if (!job) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }
  return NextResponse.json({ data: job });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const input = await newJobSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const updated = await updateJob(params.id, {
      title: input.title,
      status: input.status,
      scheduled_for: input.scheduledFor,
      expected_completion: input.expectedCompletion,
      customer_name: input.customerName,
      customer_id: input.customerId,
      assigned_employee_ids: input.assignedEmployeeIds ?? []
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
  const deleted = await deleteJob(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Ordem nao encontrada." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
