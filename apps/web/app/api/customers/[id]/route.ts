import { NextResponse } from "next/server";

import {
  deleteCustomer,
  getCustomerById,
  replaceCustomerAddresses,
  updateCustomer
} from "@/features/customers/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { newCustomerSchema } from "@/features/customers/forms/newCustomer/formSchema";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const context = await getActiveCompanyContext();
    if (!context) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }
    if (context.role === "member") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }
    const body = await request.json();
    const input = await newCustomerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });
    const normalizeOptional = (value?: string | null) =>
      value && value.trim().length > 0 ? value : null;
    const updated = await updateCustomer(id, {
      first_name: input.firstName,
      last_name: input.lastName,
      avatar_url: normalizeOptional(input.avatarUrl),
      email: normalizeOptional(input.email),
      phone: normalizeOptional(input.phone),
      company_name: normalizeOptional(input.companyName),
      notes: normalizeOptional(input.notes)
    });
    if (!updated) {
      return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
    }
    const addresses = await replaceCustomerAddresses(
      id,
      input.addresses ?? []
    );
    let avatarSignedUrl: string | null = null;
    if (updated.avatar_url) {
      const { data } = await supabaseAdmin.storage
        .from("customer-avatars")
        .createSignedUrl(updated.avatar_url, 60 * 60);
      avatarSignedUrl = data?.signedUrl ?? null;
    }
    return NextResponse.json({
      data: {
        ...updated,
        addresses,
        avatar_signed_url: avatarSignedUrl
      }
    });
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
  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }
  if (context.role === "member") {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }
  const deleted = await deleteCustomer(id);
  if (!deleted) {
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}
