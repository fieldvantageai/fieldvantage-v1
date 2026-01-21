import { NextResponse } from "next/server";

import {
  deleteCustomer,
  getCustomerById,
  updateCustomer
} from "@/features/customers/mock";
import { newCustomerSchema } from "@/features/customers/forms/newCustomer/formSchema";

type RouteParams = {
  params: { id: string };
};

export async function GET(_: Request, { params }: RouteParams) {
  const customer = await getCustomerById(params.id);
  if (!customer) {
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: customer });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const input = await newCustomerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const updated = await updateCustomer(params.id, input);
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
  const deleted = await deleteCustomer(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
