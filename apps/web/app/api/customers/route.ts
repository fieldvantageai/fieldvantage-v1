import { NextResponse } from "next/server";

import {
  createCustomer,
  listCustomers
} from "@/features/customers/mock";
import { newCustomerSchema } from "@/features/customers/forms/newCustomer/formSchema";

export async function GET() {
  const customers = await listCustomers();
  return NextResponse.json({ data: customers });
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
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
