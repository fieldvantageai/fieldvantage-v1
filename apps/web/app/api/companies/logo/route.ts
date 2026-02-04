import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxLogoSizeBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo nao enviado." },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato de arquivo invalido." },
        { status: 400 }
      );
    }

    if (file.size > maxLogoSizeBytes) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Maximo 5MB." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${context.companyId}/logo.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("company-logos")
      .upload(path, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ logo_url: path })
      .eq("id", context.companyId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    const { data: signedData } = await supabaseAdmin.storage
      .from("company-logos")
      .createSignedUrl(path, 60 * 60);

    return NextResponse.json({
      data: {
        logo_url: path,
        logo_signed_url: signedData?.signedUrl ?? null
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao enviar o logo."
      },
      { status: 400 }
    );
  }
}
