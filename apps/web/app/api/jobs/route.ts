import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import { createJob, listJobs } from "@/features/jobs/mock";

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json({ data: jobs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = await newJobSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const job = await createJob({
      title: input.title,
      status: input.status,
      scheduled_for: input.scheduledFor,
      expected_completion: input.expectedCompletion,
      customer_name: input.customerName,
      customer_id: input.customerId || "00000000-0000-0000-0000-000000000000",
      assigned_employee_ids: input.assignedEmployeeIds ?? []
    });

    return NextResponse.json({ data: job }, { status: 201 });
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
