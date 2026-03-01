import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { listBranches, createBranch } from "@/features/branches/service";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const branches = await listBranches();
    return NextResponse.json({ data: branches });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar filiais." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }

  // Apenas HQ (admin/owner sem restrição de filial) pode criar filiais
  if (context.role === "member") {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }
  if (!context.isHq) {
    return NextResponse.json(
      { error: "Gerentes de filial nao podem criar novas filiais." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, phone, address_line1, address_line2, city, state, zip_code, country } =
      body as Record<string, string | undefined>;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome da filial e obrigatorio." }, { status: 400 });
    }

    const branch = await createBranch({
      name: name.trim(),
      email: email ?? null,
      phone: phone ?? null,
      address_line1: address_line1 ?? null,
      address_line2: address_line2 ?? null,
      city: city ?? null,
      state: state ?? null,
      zip_code: zip_code ?? null,
      country: country ?? null,
      is_active: true
    });

    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar filial." },
      { status: 400 }
    );
  }
}
