import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const result = await db().query(
      "SELECT payload,synced_at FROM catalog WHERE active ORDER BY (payload->>'plays')::bigint DESC",
    );
    return NextResponse.json(
      {
        tracks: result.rows.map((r) => r.payload),
        source: "SoundCloud API snapshot",
        syncedAt: result.rows[0]?.synced_at ?? null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        tracks: [],
        source: "Sin conexión",
        warning:
          "Configura PostgreSQL y conecta SoundCloud desde tu sesión privada.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
