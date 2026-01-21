import { NextResponse } from "next/server";

import {
  createCustomer,
  listCustomers
} from "@/features/customers/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { newCustomerSchema } from "@/features/customers/forms/newCustomer/formSchema";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }
  const customers = await listCustomers();
  return NextResponse.json({ data: customers });
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const input = await newCustomerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const customer = await createCustomer(input);
    return NextResponse.json({ data: customer }, { status: 201 });
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
