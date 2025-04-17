import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  (await cookies()).set("session", "", { maxAge: 0, path: "/" });
  return NextResponse.json({ status: "cleared" });
}
