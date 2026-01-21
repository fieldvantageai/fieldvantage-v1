import { NextResponse } from "next/server";

import { registerCompanySchema } from "@/features/auth/registerCompany/formSchema";
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
        owner_name: input.ownerName
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: { userId: data.user?.id } }, { status: 201 });
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
