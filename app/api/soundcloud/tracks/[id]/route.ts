import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";

const API_BASE = process.env.SOUNDCLOUD_API_BASE ?? "https://api.soundcloud.com";
const MAX_ARTWORK_BYTES = 12 * 1024 * 1024;

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

  const { id } = await context.params;
  const contentType = request.headers.get("content-type") ?? "";

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

    const file = form.get("artwork");
    if (file instanceof File && file.size > 0) artwork = file;
  } else {
    editable = ((await request.json().catch(() => null)) ?? {}) as EditableTrack;
  }

  try {
    let payload = await updateMetadata(id, token, editable);

    if (artwork) {
      payload = await updateArtwork(id, token, artwork);
    }

    if (!payload) {
      return NextResponse.json({ error: "No editable fields supplied." }, { status: 400 });
    }

    return NextResponse.json({
      id: String(payload.urn ?? payload.id ?? id),
      title: payload.title ?? clean(editable.title, 200) ?? "",
      description:
        payload.description ?? clean(editable.description, 4000) ?? null,
      genre: payload.genre ?? clean(editable.genre, 100) ?? null,
      tagList: payload.tag_list ?? clean(editable.tagList, 1000) ?? null,
      metadataArtist:
        payload.metadata_artist ?? clean(editable.metadataArtist, 200) ?? null,
      artworkUrl: payload.artwork_url ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SoundCloud update failed.";
    const match = message.match(/^(metadata|artwork):(\d+):(.*)$/s);
    const status = match ? Number(match[2]) : 502;

    return NextResponse.json(
      {
        error: match?.[1] === "artwork"
          ? "SoundCloud rejected the artwork update."
          : "SoundCloud rejected the metadata update.",
        details: match?.[3] ?? message
      },
      { status }
    );
  }
}
