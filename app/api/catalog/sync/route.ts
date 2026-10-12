import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { accessToken, scFetch } from "@/lib/soundcloud";
import { db } from "@/lib/db";
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
    const tracks = [];
    let next: string | null = "/me/tracks?limit=50&linked_partitioning=true";
    let pages = 0;
    while (next && tracks.length < 50 && pages++ < 20) {
      const page = await scFetch(next, token);
      tracks.push(
        ...(Array.isArray(page) ? page : (page.collection ?? []))
          .filter((t: { sharing?: string }) => t.sharing === "public")
          .slice(0, 50 - tracks.length),
      );
      next = page.next_href ?? null;
    }
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE catalog SET active=false");
      for (const t of tracks)
        await client.query(
          "INSERT INTO catalog(id,payload) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET payload=$2,active=true,synced_at=now()",
          [
            String(t.id),
            JSON.stringify({
              id: String(t.id),
              title: t.title,
              plays: t.playback_count ?? 0,
              likes: t.likes_count ?? t.favoritings_count ?? 0,
              comments: t.comment_count ?? 0,
              reposts: t.reposts_count ?? 0,
              duration: t.duration,
              artworkUrl: t.artwork_url,
              permalinkUrl: t.permalink_url,
              genre: t.genre,
              metadataArtist: t.metadata_artist ?? user.username,
            }),
          ],
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
