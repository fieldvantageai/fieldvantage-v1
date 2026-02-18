import { NextResponse } from "next/server";

import { getDashboardSnapshot } from "@/features/dashboard/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";

export async function GET() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const snapshot = await getDashboardSnapshot();
    return NextResponse.json({ data: snapshot }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
