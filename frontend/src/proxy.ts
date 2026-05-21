import { NextRequest, NextResponse } from "next/server";

// Public paths that don't require auth
const PUBLIC = ["/", "/login", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public routes and Next.js internals
  if (
    PUBLIC.some((p) => pathname === p) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // For dashboard routes, full JWT validation happens on the backend.
  // The client-side useEffect guards handle redirect; here we just pass through.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
