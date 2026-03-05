import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHMENTS_PER_JOB = 20;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
];
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: jobId } = await params;
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json(
      { error: "Empresa nao encontrada." },
      { status: 404 }
    );
  }

  const { data: attachments, error } = await supabaseAdmin
    .from("job_attachments")
    .select("*")
    .eq("job_id", jobId)
    .eq("company_id", context.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withUrls = await Promise.all(
    (attachments ?? []).map(async (att) => {
      const { data } = await supabaseAdmin.storage
        .from("job-attachments")
        .createSignedUrl(att.storage_path, SIGNED_URL_EXPIRY);
      return {
        ...att,
        signed_url: data?.signedUrl ?? null
      };
    })
  );

  return NextResponse.json({ data: withUrls });
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nao autenticado." },
        { status: 401 }
      );
    }

    const context = await getActiveCompanyContext();
    if (!context) {
      return NextResponse.json(
        { error: "Empresa nao encontrada." },
        { status: 404 }
      );
    }

    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("company_id", context.companyId)
      .maybeSingle();

    if (!job) {
      return NextResponse.json(
        { error: "Ordem nao encontrada." },
        { status: 404 }
      );
    }

    const { count } = await supabaseAdmin
      .from("job_attachments")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId);

    if ((count ?? 0) >= MAX_ATTACHMENTS_PER_JOB) {
      return NextResponse.json(
        { error: `Maximo de ${MAX_ATTACHMENTS_PER_JOB} anexos por ordem.` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files");
    const note = (formData.get("note") as string | null)?.trim() || null;

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const remaining = MAX_ATTACHMENTS_PER_JOB - (count ?? 0);
    if (files.length > remaining) {
      return NextResponse.json(
        { error: `So e possivel adicionar mais ${remaining} anexo(s).` },
        { status: 400 }
      );
    }

    const uploaded: Array<Record<string, unknown>> = [];

    for (const entry of files) {
      if (!(entry instanceof File)) continue;

      if (!ALLOWED_TYPES.includes(entry.type)) {
        return NextResponse.json(
          { error: `Tipo de arquivo nao permitido: ${entry.type}` },
          { status: 400 }
        );
      }

      if (entry.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Arquivo muito grande. Maximo 10MB." },
          { status: 400 }
        );
      }

      const ext = entry.name.split(".").pop()?.toLowerCase() ?? "bin";
      const storagePath = `${context.companyId}/${jobId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("job-attachments")
        .upload(storagePath, entry, {
          contentType: entry.type
        });

      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      const { data: record, error: insertError } = await supabaseAdmin
        .from("job_attachments")
        .insert({
          job_id: jobId,
          company_id: context.companyId,
          file_name: entry.name,
          storage_path: storagePath,
          mime_type: entry.type,
          size_bytes: entry.size,
          uploaded_by: user.id,
          note
        })
        .select("*")
        .single();

      if (insertError) {
        await supabaseAdmin.storage
          .from("job-attachments")
          .remove([storagePath]);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      const { data: urlData } = await supabaseAdmin.storage
        .from("job-attachments")
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

      uploaded.push({
        ...record,
        signed_url: urlData?.signedUrl ?? null
      });
    }

    return NextResponse.json({ data: uploaded });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao enviar anexo."
      },
      { status: 500 }
    );
  }
}
