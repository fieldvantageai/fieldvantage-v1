import { NextResponse } from "next/server";

import {
  deleteCustomer,
  getCustomerById,
  updateCustomer
} from "@/features/customers/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { newCustomerSchema } from "@/features/customers/forms/newCustomer/formSchema";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }
  const customer = await getCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: customer });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const body = await request.json();
    const input = await newCustomerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const updated = await updateCustomer(id, input);
    if (!updated) {
      return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
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
  const deleted = await deleteCustomer(id);
  if (!deleted) {
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
