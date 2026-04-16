import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET || "password123";
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("admin_token")?.value;
  
  const isAuthenticated = 
    authHeader === `Bearer ${adminSecret}` || 
    cookieToken === adminSecret;

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (request.nextUrl.pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard/chat", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
