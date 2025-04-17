// src/app/api/session/set/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/", req.url));

  try {
    await getAuth().verifyIdToken(token);
    (await cookies()).set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 5,
      path: "/",
    });
    return NextResponse.redirect(new URL("/goals", req.url));
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
