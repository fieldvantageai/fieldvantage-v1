import { NextResponse } from "next/server";

import { validateInviteToken } from "@/features/invites/validateInvite";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token")?.trim() ?? "";

  const result = await validateInviteToken(rawToken);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    valid: true,
    company: result.company,
    employee: result.employee,
    invite: result.invite
  });
}
