// app/api/session/set/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { randomUUID, createHash } from "crypto";
import { db } from "~/lib/firebaseConfigs/firebaseAdminSDK";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  // Verify Firebase ID token
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Generate and map session to server
  const sessionId = generateSessionId();
  await db.collection("sessions").doc(sessionId).set({ userId: decoded.uid });

  // Set cookie in client
  (await cookies()).set({
    name: "session",
    value: sessionId,
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  

  return NextResponse.json({ success: true });
}

function generateSessionId(): string {
  const uuid = randomUUID();
  return createHash("sha256").update(uuid).digest("hex");
}
