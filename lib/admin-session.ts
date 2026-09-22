import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bm_admin_session";
const SESSION_MS = 12 * 60 * 60 * 1000;

function sessionSecret() {
  return process.env.BLACKMAMBA_SESSION_SECRET ?? process.env.BLACKMAMBA_ADMIN_PASSWORD ?? "";
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSessionToken() {
  const expires = String(Date.now() + SESSION_MS);
  const payload = \`blackmamba-admin:\${expires}\`;
  return \`\${expires}.\${signature(payload)}\`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token || !sessionSecret()) return false;

  const [expires, suppliedSignature] = token.split(".");
  if (!expires || !suppliedSignature || Number(expires) < Date.now()) return false;

  const expected = signature(\`blackmamba-admin:\${expires}\`);
  return safeEqual(suppliedSignature, expected);
}

export async function isAdminSession() {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.BLACKMAMBA_ADMIN_PASSWORD;
  if (!configured) return false;
  return safeEqual(password, configured);
}
