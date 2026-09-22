import type { DashboardData } from "@/lib/types";

export const seedData: DashboardData = {
  profile: {
    username: "Iyari Gomez",
    followers: 965,
    following: 1267,
    trackCount: 663,
    avatarUrl: null
  },
  summary: {
    plays: 1389779,
    growthPct: 492,
    likes: 12747,
    comments: 319,
    reposts: 500,
    downloads: 9,
    tracks: 663
  },
  monthly: [
    { month: "Oct", plays: 148000 },
    { month: "Nov", plays: 70000 },
    { month: "Dec", plays: 73000 },
    { month: "Jan", plays: 126000 },
    { month: "Feb", plays: 101000 },
    { month: "Mar", plays: 92000 },
    { month: "Apr", plays: 136000 },
    { month: "May", plays: 108000 },
    { month: "Jun", plays: 133000 },
    { month: "Jul", plays: 301000 },
    { month: "Aug", plays: 47000 },
    { month: "Sep", plays: 25000 }
  ],
  countries: [
    { name: "United States", plays: 194778, lat: 37.09, lon: -95.71 },
    { name: "Brazil", plays: 76548, lat: -14.24, lon: -51.93 },
    { name: "Vietnam", plays: 61531, lat: 14.06, lon: 108.28 },
    { name: "Ukraine", plays: 59124, lat: 48.38, lon: 31.17 },
    { name: "Egypt", plays: 55759, lat: 26.82, lon: 30.80 },
    { name: "Germany", plays: 35888, lat: 51.17, lon: 10.45 },
    { name: "United Kingdom", plays: 33466, lat: 55.38, lon: -3.44 },
    { name: "Indonesia", plays: 32509, lat: -0.79, lon: 113.92 },
    { name: "Saudi Arabia", plays: 30327, lat: 23.89, lon: 45.08 },
    { name: "France", plays: 29480, lat: 46.23, lon: 2.21 },
    { name: "South Korea", plays: 23327, lat: 35.91, lon: 127.77 },
    { name: "Canada", plays: 23102, lat: 56.13, lon: -106.35 },
    { name: "Mexico", plays: 22152, lat: 23.63, lon: -102.55 },
    { name: "Colombia", plays: 20913, lat: 4.57, lon: -74.30 },
    { name: "Spain", plays: 16979, lat: 40.46, lon: -3.75 }
  ],
  cities: [
    { name: "Cairo", plays: 36623, lat: 30.04, lon: 31.24 },
    { name: "Hanoi", plays: 27046, lat: 21.03, lon: 105.85 },
    { name: "Kyiv", plays: 22338, lat: 50.45, lon: 30.52 },
    { name: "Rio de Janeiro", plays: 20877, lat: -22.91, lon: -43.17 },
    { name: "Ho Chi Minh City", plays: 20514, lat: 10.82, lon: 106.63 },
    { name: "Belo Horizonte", plays: 15411, lat: -19.92, lon: -43.94 },
    { name: "Frankfurt am Main", plays: 14672, lat: 50.11, lon: 8.68 },
    { name: "Tamuning", plays: 12046, lat: 13.49, lon: 144.78 },
    { name: "Riyadh", plays: 11568, lat: 24.71, lon: 46.68 },
    { name: "Bogotá", plays: 11358, lat: 4.71, lon: -74.07 },
    { name: "Lviv", plays: 11328, lat: 49.84, lon: 24.03 },
    { name: "Jeddah", plays: 9375, lat: 21.49, lon: 39.19 },
    { name: "Honolulu", plays: 9240, lat: 21.31, lon: -157.86 },
    { name: "Kuwait City", plays: 8790, lat: 29.38, lon: 47.99 },
    { name: "Brooklyn", plays: 7956, lat: 40.68, lon: -73.94 }
  ],
  topTracks: [
    { id: "shadows", title: "Shadows", plays: 18100, likes: 209, comments: 3, reposts: 6 },
    { id: "stoned", title: "Stoned", plays: 12400, likes: 215, comments: 12, reposts: 7 },
    { id: "rise-of-the-serpent", title: "Rise of the Serpent", plays: 11300, likes: 289, comments: 5, reposts: 4 },
    { id: "midnight-glow", title: "Midnight Glow", plays: 9900, likes: 158, comments: 3, reposts: 3 },
    { id: "falling-like-fire", title: "Falling Like Fire", plays: 9000, likes: 135, comments: 1, reposts: 1 },
    { id: "purple-ocean", title: "Purple Ocean", plays: 8200, likes: 159, comments: 6, reposts: 4 },
    { id: "ancestral", title: "Ancestral", plays: 7000, likes: 121, comments: 3, reposts: 4 },
    { id: "elisa", title: "Elisa", plays: 6900, likes: 110, comments: 3, reposts: 1 }
  ],
  source: "snapshot",
  updatedAt: "2026-09-22T13:00:00-06:00"
};
