import { NextResponse } from "next/server";

import { newEmployeeSchema } from "@/features/employees/forms/newEmployee/formSchema";
import {
  deleteEmployee,
  getEmployeeById,
  updateEmployee
} from "@/features/employees/service";
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
    const body = await request.json();
    const input = await newEmployeeSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const updated = await updateEmployee(id, {
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      status: input.status
    });

    if (!updated) {
      return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
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
  const deleted = await deleteEmployee(id);
  if (!deleted) {
    return NextResponse.json({ error: "Colaborador nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
