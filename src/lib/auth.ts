"use server";
export async function setSessionCookie(token: string) {
  await fetch("/api/session/set", {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function clearSessionCookie() {
  await fetch("/api/session/clear", {
    method: "POST",
    
  });
}
