/**
 * Builds an absolute base URL from the incoming request.
 * Priority: request origin header → NEXT_PUBLIC_SITE_URL → localhost fallback.
 * Used wherever an absolute URL is required (e.g. invite links sent via email).
 */
export function getRequestBaseUrl(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return siteUrl.replace(/\/$/, "");

  return "http://localhost:3000";
}

/**
 * Builds the full invite accept link for a given raw token.
 */
export function buildInviteLink(request: Request, rawToken: string): string {
  return `${getRequestBaseUrl(request)}/invite/accept?token=${rawToken}`;
}
