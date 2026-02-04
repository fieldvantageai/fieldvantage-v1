import { NextResponse } from "next/server";

import { registerCompanySchema } from "@/features/auth/registerCompany/formSchema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = await registerCompanySchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        company_name: input.companyName,
        owner_name: input.ownerName,
        industry: input.industry,
        team_size: input.teamSize
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Usuario nao criado." },
        { status: 400 }
      );
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        owner_id: userId,
        name: input.companyName,
        email: input.email,
        industry: input.industry,
        team_size: input.teamSize
      })
      .select("id")
      .single();

    if (companyError || !company?.id) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: companyError?.message ?? "Falha ao criar empresa." },
        { status: 400 }
      );
    }

    const ownerFirstName = input.ownerName.split(" ")[0] ?? input.ownerName;
    const ownerLastName =
      input.ownerName.split(" ").slice(1).join(" ") || ownerFirstName;
    const { error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert({
        company_id: company.id,
        first_name: ownerFirstName,
        last_name: ownerLastName,
        full_name: input.ownerName,
        email: input.email,
        user_id: userId,
        role: "owner",
        is_active: true,
        invitation_status: "accepted"
      });

    if (employeeError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: employeeError.message },
        { status: 400 }
      );
    }

    await supabaseAdmin.from("company_memberships").insert({
      company_id: company.id,
      user_id: userId,
      role: "owner",
      status: "active"
    });

    await supabaseAdmin.from("user_profiles").upsert({
      user_id: userId,
      last_active_company_id: company.id
    });

    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Falha ao autenticar." },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { userId } }, { status: 201 });
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
