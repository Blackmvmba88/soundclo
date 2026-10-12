import { unseal } from "./crypto";
export function verifyOAuthState(cookie: string | undefined, suppliedState: string | null) {
  if (!cookie || !suppliedState) throw new Error("Missing OAuth state");
  const payload = unseal<{state:string;verifier:string;expiresAt:number}>(cookie);
  if (typeof payload.state !== "string" || payload.state !== suppliedState ||
      typeof payload.verifier !== "string" || payload.verifier.length < 43 ||
      !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
    throw new Error("Invalid or expired OAuth state");
  }
  return payload;
}
