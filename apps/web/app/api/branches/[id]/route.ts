import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { getBranchById, updateBranch, deleteBranch } from "@/features/branches/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const branch = await getBranchById(id);
    if (!branch) {
      return NextResponse.json({ error: "Filial nao encontrada." }, { status: 404 });
    }
    return NextResponse.json({ data: branch });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar filial." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;

  // Branch admin só pode editar suas próprias filiais
  if (!context.isHq && !context.branchIds.includes(id)) {
    return NextResponse.json({ error: "Sem permissao para editar essa filial." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const branch = await updateBranch(id, body);
    return NextResponse.json({ data: branch });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar filial." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
  }

  // Apenas HQ pode deletar filiais
  if (context.role === "member" || !context.isHq) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await deleteBranch(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao remover filial." },
      { status: 400 }
    );
  }
}
