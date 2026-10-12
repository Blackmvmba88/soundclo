import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { accessToken, scFetch } from "@/lib/soundcloud";
import { fetchPublicCatalog } from "@/lib/catalog-sync";
import { db } from "@/lib/db";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    !(await isAdminSession())
  )
    return NextResponse.json(
      { error: "Sesión privada requerida" },
      { status: 401 },
    );
  try {
    const token = await accessToken();
    if (!token)
      return NextResponse.json(
        { error: "Conecta SoundCloud" },
        { status: 503 },
      );
    const user = await scFetch("/me", token);
    if (String(user.id) !== process.env.SOUNDCLOUD_OWNER_ID)
      return NextResponse.json(
        { error: "Cuenta distinta al propietario configurado" },
        { status: 403 },
      );
    const tracks = await fetchPublicCatalog(url => scFetch(url, token));
    const payloads = tracks.map(t => ({
      id: String(t.id), title: t.title, plays: t.playback_count ?? 0,
      likes: t.likes_count ?? t.favoritings_count ?? 0, comments: t.comment_count ?? 0,
      reposts: t.reposts_count ?? 0, duration: t.duration, artworkUrl: t.artwork_url,
      permalinkUrl: t.permalink_url, genre: t.genre,
      metadataArtist: t.metadata_artist ?? user.username,
    }));
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE catalog SET active=false");
      await client.query(
        `INSERT INTO catalog(id,payload)
         SELECT item->>'id',item FROM jsonb_array_elements($1::jsonb) item
         ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,active=true,synced_at=now()`,
        [JSON.stringify(payloads)],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return NextResponse.json({ imported: tracks.length });
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo sincronizar. Revisa OAuth y la migración PostgreSQL.",
      },
      { status: 503 },
    );
  }
}
