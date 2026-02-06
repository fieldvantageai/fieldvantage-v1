import { NextResponse } from "next/server";

import { getSupabaseAuthUser } from "@/features/_shared/server";
import { listMessages, sendMessage } from "@/features/messages/service";

export async function GET(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const withUserId = searchParams.get("with")?.trim() ?? "";
  if (!withUserId) {
    return NextResponse.json({ error: "Usuario obrigatorio." }, { status: 400 });
  }

  const data = await listMessages(withUserId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as {
      recipient_user_id?: string;
      content?: string;
    };
    const recipientUserId = body.recipient_user_id?.trim() ?? "";
    const content = body.content?.trim() ?? "";

    if (!recipientUserId) {
      return NextResponse.json({ error: "Destinatario obrigatorio." }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });
    }

    const data = await sendMessage(recipientUserId, content);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao enviar mensagem."
      },
      { status: 400 }
    );
  }
}
