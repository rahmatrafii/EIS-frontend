import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/constants/routes";

// List of public routes that do not require authentication
const PUBLIC_ROUTES = [
  ROUTES.welcome,
  ROUTES.login,
  ROUTES.register,
  ROUTES.verifyOtp,
  ROUTES.admin.login,
  "/retention", // prefix matching for retention token urls
];

// List of admin-only routes
const ADMIN_ROUTES = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get("eis_auth")?.value;
  const userRole = request.cookies.get("eis_role")?.value;

  // 1. Handle ROOT Path / Redirection using Proxy
  if (pathname === "/") {
    if (authCookie) {
      if (userRole?.toLowerCase() === "admin") {
        return NextResponse.redirect(new URL(ROUTES.admin.dashboard, request.url));
      }
      return NextResponse.redirect(new URL(ROUTES.home, request.url));
    }
    return NextResponse.redirect(new URL(ROUTES.welcome, request.url));
  }

  // 2. Check if the current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // 3. Route Guard: If not logged in and accessing a protected route
  if (!isPublicRoute && !authCookie) {
    const isUnderAdmin = pathname.startsWith("/admin");
    const loginUrl = new URL(isUnderAdmin ? ROUTES.admin.login : ROUTES.login, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Visitor Guard: Accessing visitor route but is an admin
  const isVisitorRoute = !isPublicRoute && !pathname.startsWith("/admin");
  if (isVisitorRoute && userRole?.toLowerCase() === "admin") {
    return NextResponse.redirect(new URL(ROUTES.admin.dashboard, request.url));
  }

  // 4. Role Guard: Accessing admin route but is not admin
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route)) && pathname !== ROUTES.admin.login;
  if (isAdminRoute && userRole?.toLowerCase() !== "admin") {
    // If returning visitor, redirect to visitor home, otherwise to login
    const fallbackUrl = authCookie
      ? new URL(ROUTES.home, request.url)
      : new URL(ROUTES.login, request.url);
    return NextResponse.redirect(fallbackUrl);
  }

  // 5. If already logged in and visiting auth pages (welcome/login/register/admin-login), redirect to home
  if (authCookie && (pathname === ROUTES.welcome || pathname === ROUTES.login || pathname === ROUTES.register || pathname === ROUTES.admin.login)) {
    if (userRole?.toLowerCase() === "admin") {
      return NextResponse.redirect(new URL(ROUTES.admin.dashboard, request.url));
    }
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)"],
};
