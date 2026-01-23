import { NextResponse } from "next/server";

import { getMyCompany, upsertMyCompany } from "@/features/companies/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }
  const company = await getMyCompany();
  if (!company?.logo_url) {
    return NextResponse.json({ data: company });
  }

  const { data } = await supabaseAdmin.storage
    .from("company-logos")
    .createSignedUrl(company.logo_url, 60 * 60);

  return NextResponse.json({
    data: {
      ...company,
      logo_signed_url: data?.signedUrl ?? null
    }
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      industry?: string | null;
      email?: string | null;
      phone?: string | null;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      state?: string | null;
      zip_code?: string | null;
      country?: string | null;
      logo_url?: string | null;
    };

    if (!body.name) {
      return NextResponse.json(
        { error: "Nome da empresa obrigatorio." },
        { status: 400 }
      );
    }

    const company = await upsertMyCompany(body as { name: string });

    if (!company?.logo_url) {
      return NextResponse.json({ data: company });
    }

    const { data } = await supabaseAdmin.storage
      .from("company-logos")
      .createSignedUrl(company.logo_url, 60 * 60);

    return NextResponse.json({
      data: {
        ...company,
        logo_signed_url: data?.signedUrl ?? null
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
