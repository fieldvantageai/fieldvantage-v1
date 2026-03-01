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
  // localhost / 127.0.0.1      → serve only marketing routes in local env
  // app.geklix.com / app.localhost / staging.geklix.com → serve the full SaaS app
  const requestHostHeader = request.headers.get("host") ?? "";
  const requestHostname = requestHostHeader.split(":")[0]?.toLowerCase() ?? "";
  const requestPort = request.nextUrl.port;

  const isLocalMarketingHost =
    requestHostname === "localhost" || requestHostname === "127.0.0.1";
  const isAppDomain = requestHostname.startsWith("app.") ||
    (process.env.NEXT_PUBLIC_APP_HOST
      ? requestHostname === process.env.NEXT_PUBLIC_APP_HOST
      : false);

  if (!isAppDomain) {
    // Marketing domain: only allow "/" and "/invite/accept/*"
    if (!isMarketingAllowed(pathname)) {
      const dest = request.nextUrl.clone();
      const appHost =
        isLocalMarketingHost
          ? requestPort ? `app.localhost:${requestPort}` : "app.localhost"
          : (process.env.NEXT_PUBLIC_APP_HOST ?? `app.${requestHostname}`);
      dest.host = appHost;
      return NextResponse.redirect(dest, { status: 301 });
    }
    // Skip all auth/tenant logic for marketing visitors
    return response;
  }
  // ── End hostname routing ───────────────────────────────────────────────────

  // On the app domain, "/" has no content — redirect to the app entry point.
  // The auth logic below will then redirect logged-in users to /dashboard.
  if (pathname === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/entrar";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

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

  if (process.env.NODE_ENV === "development") {
    console.log(`[middleware] ${pathname} | user=${user?.id ?? "none"}`);
  }

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
    // Using SECURITY DEFINER RPC to avoid JWT/RLS issues in Edge middleware
    const { data: memberships } = await supabase
      .rpc("get_my_memberships") as {
        data: Array<{ company_id: string; role: string; status: string; branch_id: string | null; branch_ids: string[] | null }> | null
      };

    const activeCookie = request.cookies.get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
    const activeMembership = memberships?.find(
      (membership) => membership.company_id === activeCookie
    );
    const membershipCount = memberships?.length ?? 0;

    if (process.env.NODE_ENV === "development") {
      console.log(`[middleware] memberships=${membershipCount} cookie=${activeCookie ?? "none"}`);
    }
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
      // Determine destination based on membership state
      let destination: string;
      if (resolvedActiveMembership) {
        destination = "/dashboard";
      } else if (membershipCount === 0) {
        // No companies yet → stay at /comecar (or go there from other auth paths)
        destination = "/comecar";
      } else {
        // Has companies but no active selection
        destination = "/select-company";
      }
      // Avoid redirect loop: don't redirect if already at destination
      if (pathname !== destination) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = destination;
        redirectUrl.search = "";
        const redirectResponse = NextResponse.redirect(redirectUrl);
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
        return redirectResponse;
      }
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
  matcher: ["/((?!_next|favicon.ico|images|brand|api).*)"]
};
