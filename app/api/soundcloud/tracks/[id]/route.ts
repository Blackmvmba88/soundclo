import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";

const API_BASE = "https://api.soundcloud.com";
import { accessToken } from "@/lib/soundcloud";

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

async function updateMetadata(
  trackRef: string,
  token: string,
  editable: EditableTrack
) {
  const track: Record<string, string> = {};
  const title = clean(editable.title, 200);
  const description = clean(editable.description, 4000);
  const genre = clean(editable.genre, 100);
  const tagList = clean(editable.tagList, 1000);
  const metadataArtist = clean(editable.metadataArtist, 200);

  if (title) track.title = title;
  if (description !== undefined) track.description = description;
  if (genre !== undefined) track.genre = genre;
  if (tagList !== undefined) track.tag_list = tagList;
  if (metadataArtist !== undefined) track.metadata_artist = metadataArtist;

  if (!Object.keys(track).length) return null;

  const response = await fetch(
    `${API_BASE}/tracks/${encodeURIComponent(trackRef)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `OAuth ${token}`,
        Accept: "application/json; charset=utf-8",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ track }),
      cache: "no-store"
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `metadata:${response.status}:${JSON.stringify(payload).slice(0, 1000)}`
    );
  }

  return payload;
}

async function updateArtwork(trackRef: string, token: string, artwork: File) {
  if (!artwork.type.startsWith("image/")) {
    throw new Error("artwork:400:Selected file is not an image.");
  }
  if (artwork.size > MAX_ARTWORK_BYTES) {
    throw new Error("artwork:413:Artwork is larger than 12 MB.");
  }

  const body = new FormData();
  body.append("track[artwork_data]", artwork, artwork.name || "cover.jpg");

  const response = await fetch(
    `${API_BASE}/tracks/${encodeURIComponent(trackRef)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `OAuth ${token}`,
        Accept: "application/json; charset=utf-8"
      },
      body,
      cache: "no-store"
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `artwork:${response.status}:${JSON.stringify(payload).slice(0, 1000)}`
    );
  }

  return payload;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      { error: "Admin session required." },
      { status: 401 },
    );
  }

  const token = await accessToken();
  if (!token) {
    return NextResponse.json(
      { error: "SOUNDCLOUD_ACCESS_TOKEN is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as EditableTrack | null;
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  let editable: EditableTrack = {};
  let artwork: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    editable = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      genre: String(form.get("genre") ?? ""),
      tagList: String(form.get("tagList") ?? ""),
      metadataArtist: String(form.get("metadataArtist") ?? "")
    };

  if (!Object.keys(track).length) {
    return NextResponse.json(
      { error: "No editable fields supplied." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const response = await fetch(`${API_BASE}/tracks/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `OAuth ${token}`,
      Accept: "application/json; charset=utf-8",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ track }),
    cache: "no-store",
  });

    return NextResponse.json(
      { error: "SoundCloud rejected the update.", details: payload },
      { status: response.status },
    );
  }

  return NextResponse.json({
    id: String(payload.id ?? id),
    title: payload.title ?? title,
    description: payload.description ?? description ?? null,
    genre: payload.genre ?? genre ?? null,
    tagList: payload.tag_list ?? tagList ?? null,
    metadataArtist: payload.metadata_artist ?? metadataArtist ?? null,
  });
}
