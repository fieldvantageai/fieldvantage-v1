import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/comecar",
  "/entrar",
  "/login",
  "/register",
  "/register/company",
  "/forgot-password",
  "/invite/accept"
];

const AUTH_ONLY_PATHS = [
  "/comecar",
  "/entrar",
  "/login",
  "/register",
  "/register/company",
  "/forgot-password"
];

const EMPLOYEE_ONLY_PATHS = [
  "/dashboard",
  "/jobs",
  "/settings",
  "/messages",
  "/invites"
];
const ACTIVE_COMPANY_COOKIE = "fv_active_company";

const isEmployeeAllowedPath = (pathname: string) =>
  EMPLOYEE_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const isAuthOnlyPath = (pathname: string) =>
  AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const MARKETING_ALLOWED_PATHS = ["/", "/invite/accept"];

const isMarketingAllowed = (p: string) =>
  MARKETING_ALLOWED_PATHS.some((m) => p === m || p.startsWith(`${m}/`));

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const pathname = request.nextUrl.pathname;

  // ── Hostname-based domain routing ─────────────────────────────────────────
  // geklix.com / www.geklix.com → serve only marketing routes
  // app.geklix.com / localhost  → serve the full SaaS app
  const hostname = request.headers.get("host") ?? "";
  const isLocal =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isAppDomain = isLocal || hostname.startsWith("app.");

  if (!isAppDomain) {
    // Marketing domain: only allow "/" and "/invite/accept/*"
    if (!isMarketingAllowed(pathname)) {
      const dest = request.nextUrl.clone();
      dest.host = "app.geklix.com";
      return NextResponse.redirect(dest, { status: 301 });
    }
    // Skip all auth/tenant logic for marketing visitors
    return response;
  }
  // ── End hostname routing ───────────────────────────────────────────────────

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Parameters<typeof response.cookies.set>[2];
        }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathname)) {
    const nextPath = `${pathname}${request.nextUrl.search}`;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/entrar";
    redirectUrl.search = `?next=${encodeURIComponent(nextPath)}`;
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (user) {
    const { data: memberships } = await supabase
      .from("company_memberships")
      .select("company_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active");

    const activeCookie = request.cookies.get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
    const activeMembership = memberships?.find(
      (membership) => membership.company_id === activeCookie
    );
    const membershipCount = memberships?.length ?? 0;
    const isSelectCompanyRoute = pathname === "/select-company";
    const resolvedActiveMembership =
      activeMembership ?? (membershipCount === 1 ? memberships?.[0] ?? null : null);

    if (membershipCount === 0 && !isPublicPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/comecar";
      redirectUrl.search = "";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }

    if (membershipCount === 1 && memberships?.[0]) {
      const only = memberships[0];
      if (activeCookie !== only.company_id) {
        response.cookies.set(ACTIVE_COMPANY_COOKIE, only.company_id, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/"
        });
      }
      if (isSelectCompanyRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        redirectUrl.search = "";
        const redirectResponse = NextResponse.redirect(redirectUrl);
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
        return redirectResponse;
      }
    }

    if (membershipCount > 1) {
      if (!activeMembership && !isSelectCompanyRoute && !isPublicPath(pathname)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/select-company";
        redirectUrl.search = "";
        const redirectResponse = NextResponse.redirect(redirectUrl);
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
        return redirectResponse;
      }
      if (activeMembership && isSelectCompanyRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        redirectUrl.search = "";
        const redirectResponse = NextResponse.redirect(redirectUrl);
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
        return redirectResponse;
      }
    }

    if (isAuthOnlyPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = resolvedActiveMembership ? "/dashboard" : "/select-company";
      redirectUrl.search = "";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }

    if (resolvedActiveMembership?.role === "member" && !isEmployeeAllowedPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }

    if (
      resolvedActiveMembership?.role === "member" &&
      pathname.startsWith("/settings/company")
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/settings";
      redirectUrl.search = "";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|images|api).*)"]
};
