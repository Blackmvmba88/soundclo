export type Metric = {
  label: string;
  value: number;
};

export type MonthlyPoint = {
  month: string;
  plays: number;
};

export type GeoPoint = {
  name: string;
  plays: number;
  lat: number;
  lon: number;
};

export type TrackMetric = {
  id: string;
  title: string;
  plays: number;
  likes: number;
  comments: number;
  reposts?: number;
  duration?: number;
  artworkUrl?: string | null;
  permalinkUrl?: string | null;
};

export type DashboardData = {
  profile: {
    username: string;
    followers: number;
    following: number;
    trackCount: number;
    avatarUrl?: string | null;
  };
  summary: {
    plays: number;
    growthPct: number;
    likes: number;
    comments: number;
    reposts: number;
    downloads: number;
    tracks: number;
  };
  monthly: MonthlyPoint[];
  countries: GeoPoint[];
  cities: GeoPoint[];
  topTracks: TrackMetric[];
  source: "snapshot" | "hybrid";
  updatedAt: string;
};
