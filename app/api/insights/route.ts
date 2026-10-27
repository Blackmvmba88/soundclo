import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
export async function GET() {
  if (!(await isAdminSession())) return new Response(null, { status: 401 });
  try {
    const result = await db().query(
      "SELECT track_id, count(*) FILTER(WHERE kind='PLAY')::int AS starts,count(*) FILTER(WHERE kind='FINISH')::int AS finishes,count(DISTINCT session_id)::int AS sessions FROM listen_events WHERE received_at>now()-interval '30 days' GROUP BY track_id ORDER BY starts DESC",
    );
    return NextResponse.json(
      {
        source: "Eventos reportados por el widget · últimos 30 días",
        tracks: result.rows,
        notice:
          "No equivalen a reproducciones acreditadas por SoundCloud. Países, ciudades y retención aún no disponibles.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Configura PostgreSQL" },
      { status: 503 },
    );
  }
}
