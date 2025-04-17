// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isLoggedIn = !!session; // In production, check session in Firestore

  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/goals", request.url));
  }

  if (!isLoggedIn && pathname.startsWith("/goals")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/goals/:path*"],
};
