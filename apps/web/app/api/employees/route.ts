import { NextResponse } from "next/server";

import { newEmployeeSchema } from "@/features/employees/forms/newEmployee/formSchema";
import { createEmployee, listEmployees } from "@/features/employees/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const body = await request.json();
    const input = await newEmployeeSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const normalizeOptional = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const employee = await createEmployee({
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

    let avatarSignedUrl: string | null = null;
    if (employee.avatar_url) {
      const { data } = await supabaseAdmin.storage
        .from("customer-avatars")
        .createSignedUrl(employee.avatar_url, 60 * 60);
      avatarSignedUrl = data?.signedUrl ?? null;
    }

    return NextResponse.json(
      {
        data: {
          ...employee,
          avatar_signed_url: avatarSignedUrl
        }
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
