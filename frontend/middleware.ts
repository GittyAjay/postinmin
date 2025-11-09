import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "postinmin_session";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/privacy", "/contact", "/docs"];
//comment
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const hasSession = request.cookies.has(AUTH_COOKIE);

  if (!isPublic && !hasSession && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

