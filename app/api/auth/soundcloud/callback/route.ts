import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyOAuthState } from "@/lib/oauth-state";
import { exchange, saveTokens, scFetch } from "@/lib/soundcloud";
export async function GET(request: Request) {
  const store = await cookies();
  const cookie = store.get("bm_oauth")?.value;
  store.delete("bm_oauth");
  try {
    const url = new URL(request.url);
    if (!url.searchParams.get("code")) throw new Error("Missing authorization code");
    // The encrypted, expiring nonce is issued only after admin authentication.
    // Strict admin cookies are intentionally unavailable on cross-site callbacks.
    const { verifier } = verifyOAuthState(cookie, url.searchParams.get("state"));
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
