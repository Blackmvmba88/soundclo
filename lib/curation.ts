import type { TrackMetric } from "@/lib/types";

export type CurationIssue =
  | "cover"
  | "artist"
  | "genre"
  | "tags"
  | "description";

export const CURATION_LABELS: Record<CurationIssue, string> = {
  cover: "Portada",
  artist: "Artista",
  genre: "Género",
  tags: "Tags",
  description: "Descripción"
};

export function curationIssues(track: TrackMetric): CurationIssue[] {
  const issues: CurationIssue[] = [];

  if (!track.artworkUrl) issues.push("cover");
  if (!track.metadataArtist?.trim()) issues.push("artist");
  if (!track.genre?.trim()) issues.push("genre");
  if (!track.tagList?.trim()) issues.push("tags");
  if (!track.description?.trim()) issues.push("description");

  return issues;
}

export function curationScore(track: TrackMetric) {
  const issues = curationIssues(track);
  const weights: Record<CurationIssue, number> = {
    cover: 5,
    artist: 3,
    genre: 2,
    tags: 2,
    description: 1
  };

  const missingWeight = issues.reduce((total, issue) => total + weights[issue], 0);
  const trafficWeight = Math.log10(Math.max(track.plays, 1) + 1);

  return missingWeight * 100 + trafficWeight;
}

export function isCurated(track: TrackMetric) {
  return curationIssues(track).length === 0;
}
