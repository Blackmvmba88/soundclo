import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    !(await isAdminSession())
  )
    return new Response(null, { status: 401 });
  if (!process.env.FIRECRAWL_API_KEY)
    return NextResponse.json(
      { error: "Configura FIRECRAWL_API_KEY" },
      { status: 503 },
    );
  try {
    const body = await request.json();
    const url = new URL(body.url);
    const allowed = (process.env.FIRECRAWL_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((s) => s.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !allowed.includes(url.hostname)
    )
      return NextResponse.json(
        { error: "Usa un dominio público aprobado en FIRECRAWL_ALLOWED_HOSTS" },
        { status: 400 },
      );
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url.href,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error("Firecrawl unavailable");
    const data = await res.json();
    if (!data.success) throw new Error("Scrape failed");
    await db().query(
      "INSERT INTO enrichment(url,payload) VALUES($1,$2) ON CONFLICT(url) DO UPDATE SET payload=$2,fetched_at=now()",
      [url.href, JSON.stringify(data.data)],
    );
    return NextResponse.json({
      url: url.href,
      metadata: data.data?.metadata,
      source: "Firecrawl",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo indexar la página pública" },
      { status: 502 },
    );
  }
}
