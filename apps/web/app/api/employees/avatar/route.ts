import { NextResponse } from "next/server";

import { getOwnerCompanyId, getSupabaseAuthUser } from "@/features/_shared/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const maxAvatarSizeBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo nao enviado." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Formato de arquivo invalido." },
        { status: 400 }
      );
    }

    if (file.size > maxAvatarSizeBytes) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Maximo 5MB." },
        { status: 400 }
      );
    }

    const companyId = await getOwnerCompanyId();
    if (!companyId) {
      return NextResponse.json(
        { error: "Empresa nao encontrada." },
        { status: 404 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${companyId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("customer-avatars")
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

    const { data } = await supabaseAdmin.storage
      .from("customer-avatars")
      .createSignedUrl(path, 60 * 60);

    return NextResponse.json({
      data: {
        avatar_url: path,
        avatar_signed_url: data?.signedUrl ?? null
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao enviar o avatar."
      },
      { status: 400 }
    );
  }
}
