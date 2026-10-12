import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { unseal } from "@/lib/crypto";
import { exchange, saveTokens, scFetch } from "@/lib/soundcloud";
import { isAdminSession } from "@/lib/admin-session";
export async function GET(request: Request) {
  const store = await cookies();
  const cookie = store.get("bm_oauth")?.value;
  store.delete("bm_oauth");
  try {
    if (!(await isAdminSession()) || !cookie)
      throw new Error("Invalid session");
    const { state, verifier } = unseal<{ state: string; verifier: string }>(
      cookie,
    );
    const url = new URL(request.url);
    if (
      url.searchParams.get("state") !== state ||
      !url.searchParams.get("code")
    )
      throw new Error("Invalid OAuth state");
    const tokens = await exchange({
      grant_type: "authorization_code",
      code: url.searchParams.get("code")!,
      code_verifier: verifier,
      redirect_uri: process.env.SOUNDCLOUD_REDIRECT_URI!,
    });
    const user = await scFetch("/me", tokens.access_token);
    if (
      !process.env.SOUNDCLOUD_OWNER_ID ||
      String(user.id) !== process.env.SOUNDCLOUD_OWNER_ID
    )
      throw new Error("Owner ID mismatch");
    await saveTokens(tokens);
    return NextResponse.redirect(
      new URL("/?connected=1", process.env.SOUNDCLOUD_REDIRECT_URI),
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "No se conectó la cuenta. Revisa sesión, owner ID y configuración OAuth.",
      },
      { status: 400 },
    );
  }
}
