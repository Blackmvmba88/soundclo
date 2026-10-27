import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validEvent } from "@/lib/event-validation";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 2048)
    return new Response(null, { status: 413 });
  const body = await request.json().catch(() => null);
  if (!validEvent(body))
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  try {
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        body.sessionId,
      ]);
      const count = await client.query(
        "SELECT count(*)::int AS n FROM listen_events WHERE session_id=$1 AND received_at>now()-interval '1 minute'",
        [body.sessionId],
      );
      if (count.rows[0].n >= 30) {
        await client.query("ROLLBACK");
        return new Response(null, { status: 429 });
      }
      await client.query(
        "INSERT INTO listen_events(id,session_id,track_id,kind,position_ms) SELECT $1,$2,$3,$4,$5 WHERE EXISTS(SELECT 1 FROM catalog WHERE id=$3 AND active) ON CONFLICT(id) DO NOTHING",
        [body.id, body.sessionId, body.trackId, body.kind, body.positionMs],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Event storage unavailable" },
      { status: 503 },
    );
  }
}
