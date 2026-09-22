import { NextResponse } from "next/server";
import { seedData } from "@/data/seed";
import type { DashboardData, TrackMetric } from "@/lib/types";

type SoundCloudUser = {
  username?: string;
  followers_count?: number;
  followings_count?: number;
  track_count?: number;
  avatar_url?: string | null;
};

type SoundCloudTrack = {
  id: number | string;
  title?: string;
  playback_count?: number;
  likes_count?: number;
  favoritings_count?: number;
  comment_count?: number;
  reposts_count?: number;
  duration?: number;
  artwork_url?: string | null;
  permalink_url?: string | null;
  waveform_url?: string | null;
  description?: string | null;
  genre?: string | null;
  tag_list?: string | null;
  metadata_artist?: string | null;
};

type CollectionResponse = {
  collection?: SoundCloudTrack[];
  next_href?: string | null;
};

const API_BASE = process.env.SOUNDCLOUD_API_BASE ?? "https://api.soundcloud.com";

async function soundCloudFetch<T>(urlOrPath: string, token: string): Promise<T> {
  const url = urlOrPath.startsWith("http") ? urlOrPath : `${API_BASE}${urlOrPath}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `OAuth ${token}`,
      Accept: "application/json; charset=utf-8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`SoundCloud ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

async function fetchAllTracks(token: string) {
  const tracks: SoundCloudTrack[] = [];
  let next: string | null = "/me/tracks?limit=200&linked_partitioning=true";
  let pages = 0;

  while (next && pages < 10) {
    const page: CollectionResponse = await soundCloudFetch<CollectionResponse>(next, token);
    tracks.push(...(page.collection ?? []));
    next = page.next_href ?? null;
    pages += 1;
  }

  return tracks;
}

export async function GET() {
  const token = process.env.SOUNDCLOUD_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(seedData, {
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const [user, tracks] = await Promise.all([
      soundCloudFetch<SoundCloudUser>("/me", token),
      fetchAllTracks(token)
    ]);

    const mapped: TrackMetric[] = tracks
      .map((track) => ({
        id: String(track.id),
        title: track.title ?? "Untitled",
        plays: track.playback_count ?? 0,
        likes: track.likes_count ?? track.favoritings_count ?? 0,
        comments: track.comment_count ?? 0,
        reposts: track.reposts_count ?? 0,
        duration: track.duration,
        artworkUrl: track.artwork_url ?? null,
        permalinkUrl: track.permalink_url ?? null,
        waveformUrl: track.waveform_url ?? null,
        description: track.description ?? null,
        genre: track.genre ?? null,
        tagList: track.tag_list ?? null,
        metadataArtist: track.metadata_artist ?? null
      }))
      .sort((a, b) => b.plays - a.plays);

    const data: DashboardData = {
      ...seedData,
      profile: {
        username: user.username ?? seedData.profile.username,
        followers: user.followers_count ?? seedData.profile.followers,
        following: user.followings_count ?? seedData.profile.following,
        trackCount: user.track_count ?? tracks.length ?? seedData.profile.trackCount,
        avatarUrl: user.avatar_url ?? seedData.profile.avatarUrl
      },
      summary: {
        ...seedData.summary,
        tracks: user.track_count ?? tracks.length ?? seedData.summary.tracks
      },
      topTracks: mapped.length ? mapped.slice(0, 24) : seedData.topTracks,
      source: "hybrid",
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ...seedData,
        apiWarning: "SoundCloud API unavailable; showing the saved Insights snapshot."
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
