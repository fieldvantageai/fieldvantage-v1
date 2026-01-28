import { NextResponse } from "next/server";

import {
  createCustomer,
  listCustomers,
  replaceCustomerAddresses
} from "@/features/customers/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { newCustomerSchema } from "@/features/customers/forms/newCustomer/formSchema";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const normalizeOptional = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    const customer = await createCustomer({
      first_name: input.firstName,
      last_name: input.lastName,
      avatar_url: normalizeOptional(input.avatarUrl),
      email: normalizeOptional(input.email),
      phone: normalizeOptional(input.phone),
      company_name: normalizeOptional(input.companyName),
      notes: normalizeOptional(input.notes)
    });

    const addresses = await replaceCustomerAddresses(
      customer.id,
      input.addresses ?? []
    );

    let avatarSignedUrl: string | null = null;
    if (customer.avatar_url) {
      const { data } = await supabaseAdmin.storage
        .from("customer-avatars")
        .createSignedUrl(customer.avatar_url, 60 * 60);
      avatarSignedUrl = data?.signedUrl ?? null;
    }

    return NextResponse.json(
      {
        data: {
          ...customer,
          addresses,
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
