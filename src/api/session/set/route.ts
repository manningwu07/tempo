import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  try {
    // Verify the token with Firebase Admin SDK
    const decoded = await getAuth().verifyIdToken(token);

    // Set a secure, HTTP-only cookie
    (await cookies()).set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: "/",
    });

    return NextResponse.json({ status: "success" });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
