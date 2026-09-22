import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";

const API_BASE = process.env.SOUNDCLOUD_API_BASE ?? "https://api.soundcloud.com";

type EditableTrack = {
  title?: string;
  description?: string;
  genre?: string;
  tagList?: string;
  metadataArtist?: string;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Admin session required." }, { status: 401 });
  }

  const token = process.env.SOUNDCLOUD_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "SOUNDCLOUD_ACCESS_TOKEN is not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as EditableTrack | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const track: Record<string, string> = {};
  const title = clean(body.title, 200);
  const description = clean(body.description, 4000);
  const genre = clean(body.genre, 100);
  const tagList = clean(body.tagList, 1000);
  const metadataArtist = clean(body.metadataArtist, 200);

  if (title) track.title = title;
  if (description !== undefined) track.description = description;
  if (genre !== undefined) track.genre = genre;
  if (tagList !== undefined) track.tag_list = tagList;
  if (metadataArtist !== undefined) track.metadata_artist = metadataArtist;

  if (!Object.keys(track).length) {
    return NextResponse.json({ error: "No editable fields supplied." }, { status: 400 });
  }

  const { id } = await context.params;
  const response = await fetch(\`\${API_BASE}/tracks/\${encodeURIComponent(id)}\`, {
    method: "PUT",
    headers: {
      Authorization: \`OAuth \${token}\`,
      Accept: "application/json; charset=utf-8",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ track }),
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { error: "SoundCloud rejected the update.", details: payload },
      { status: response.status }
    );
  }

  return NextResponse.json({
    id: String(payload.id ?? id),
    title: payload.title ?? title,
    description: payload.description ?? description ?? null,
    genre: payload.genre ?? genre ?? null,
    tagList: payload.tag_list ?? tagList ?? null,
    metadataArtist: payload.metadata_artist ?? metadataArtist ?? null
  });
}
