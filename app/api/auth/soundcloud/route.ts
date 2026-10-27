import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { isAdminSession } from "@/lib/admin-session";
import { hasDatabase } from "@/lib/db";
import { seal } from "@/lib/crypto";
export async function GET() {
  if (!(await isAdminSession()))
    return NextResponse.json(
      { error: "Inicia tu sesión privada primero" },
      { status: 401 },
    );
  if (
    !process.env.SOUNDCLOUD_CLIENT_ID ||
    !process.env.SOUNDCLOUD_CLIENT_SECRET ||
    !process.env.SOUNDCLOUD_REDIRECT_URI ||
    !hasDatabase()
  )
    return NextResponse.json(
      { error: "Falta configurar OAuth y PostgreSQL" },
      { status: 503 },
    );
  const state = randomBytes(32).toString("base64url"),
    verifier = randomBytes(48).toString("base64url");
  const store = await cookies();
  store.set("bm_oauth", seal({ state, verifier, expiresAt: Date.now() + 600000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/auth/soundcloud",
  });
  const url = new URL("https://secure.soundcloud.com/authorize");
  url.search = new URLSearchParams({
    client_id: process.env.SOUNDCLOUD_CLIENT_ID,
    redirect_uri: process.env.SOUNDCLOUD_REDIRECT_URI,
    response_type: "code",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return NextResponse.redirect(url);
}
