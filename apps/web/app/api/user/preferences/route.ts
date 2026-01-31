import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedPreferences = ["auto", "google_maps", "apple_maps", "waze"] as const;
type NavigationPreference = (typeof allowedPreferences)[number];

const normalizePreference = (value: unknown): NavigationPreference | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim() as NavigationPreference;
  return allowedPreferences.includes(trimmed) ? trimmed : null;
};

const getEmployeeByEmail = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  email: string
) => {
  const { data, error } = await supabase
    .from("employees")
    .select("id, preferred_navigation_app, email")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const email = data.user.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email nao encontrado." }, { status: 400 });
  }

  const employee = await getEmployeeByEmail(supabase, email);
  if (!employee) {
    return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      preferred_navigation_app: employee.preferred_navigation_app ?? null
    }
  });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const email = data.user.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "Email nao encontrado." }, { status: 400 });
    }

    const employee = await getEmployeeByEmail(supabase, email);
    if (!employee) {
      return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
    }

    const body = (await request.json()) as {
      preferred_navigation_app?: string | null;
    };
    const preference =
      body.preferred_navigation_app === null
        ? null
        : normalizePreference(body.preferred_navigation_app ?? "auto");

    if (!preference && body.preferred_navigation_app !== null) {
      return NextResponse.json({ error: "Preferencia invalida." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("employees")
      .update({ preferred_navigation_app: preference })
      .eq("id", employee.id)
      .select("preferred_navigation_app")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        preferred_navigation_app: updated?.preferred_navigation_app ?? null
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
