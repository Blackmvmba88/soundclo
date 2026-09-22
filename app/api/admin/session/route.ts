import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  isAdminSession,
  verifyAdminPassword
} from "@/lib/admin-session";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSession() });
}

export async function POST(request: Request) {
  if (!process.env.BLACKMAMBA_ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin password is not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60
  });

  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return NextResponse.json({ authenticated: false });
}
