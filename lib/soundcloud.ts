import { db } from "./db";
import { seal, unseal } from "./crypto";
export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};
export async function exchange(
  params: Record<string, string>,
): Promise<Tokens> {
  const res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...params,
      client_id: process.env.SOUNDCLOUD_CLIENT_ID!,
      client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok)
    throw new Error(`SoundCloud token exchange failed (${res.status})`);
  const data = await res.json();
  if (!data.access_token || !data.refresh_token)
    throw new Error("Invalid token response");
  return { ...data, expires_at: Date.now() + data.expires_in * 1000 };
}
export async function saveTokens(tokens: Tokens) {
  await db().query(
    "INSERT INTO sc_connection(id,token) VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET token=$1,updated_at=now()",
    [seal(tokens)],
  );
}
export async function accessToken() {
  if (!process.env.DATABASE_URL)
    return process.env.SOUNDCLOUD_ACCESS_TOKEN ?? null;
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT token FROM sc_connection WHERE id=1 FOR UPDATE",
    );
    if (!result.rows.length) {
      await client.query("COMMIT");
      return process.env.SOUNDCLOUD_ACCESS_TOKEN ?? null;
    }
    let tokens = unseal<Tokens>(result.rows[0].token);
    if (tokens.expires_at < Date.now() + 60000) {
      tokens = await exchange({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
      });
      await client.query(
        "UPDATE sc_connection SET token=$1,updated_at=now() WHERE id=1",
        [seal(tokens)],
      );
    }
    await client.query("COMMIT");
    return tokens.access_token;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function scFetch(path: string, token: string) {
  const url = new URL(path, "https://api.soundcloud.com");
  if (url.origin !== "https://api.soundcloud.com")
    throw new Error("Invalid API pagination origin");
  const res = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`SoundCloud request failed (${res.status})`);
  return res.json();
}
