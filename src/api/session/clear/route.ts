import { NextResponse } from "next/server";
import { cookies } from "next/headers";


export async function POST() {
    (await cookies()).set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });
    return NextResponse.json({ status: "cleared" });
  }
  