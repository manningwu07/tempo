"use server";
import { cookies } from "next/headers";

export async function setSessionCookie(token: string) {
  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 5, // 5 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  (await cookies()).set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}
