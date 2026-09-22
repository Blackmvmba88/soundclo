# BlackMamba Insights

Animated SoundCloud analytics for **Iyari Gomez / BlackMamba Records**.

This first version turns the catalog into a visual experience instead of a conventional analytics table: global pulse, 12-month momentum, catalog depth, top tracks and animated KPI cards.

## Stack

- Next.js 15
- React 19
- TypeScript
- Framer Motion
- Recharts
- Server-side SoundCloud adapter

## Run locally

```bash
git clone https://github.com/Blackmvmba88/soundclo.git
cd soundclo
git checkout feat/blackmamba-insights-v1
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## SoundCloud API

The dashboard works immediately with the saved Insights snapshot. To activate live profile and catalog data, add a valid OAuth token to `.env.local`:

```env
SOUNDCLOUD_ACCESS_TOKEN=your_token_here
SOUNDCLOUD_API_BASE=https://api.soundcloud.com
```

**Never commit the token.** `.env*` files are ignored by Git.

The server route at `/api/soundcloud` reads the token only on the server and pulls:

- authenticated profile
- followers / following
- track count
- complete track catalog (paginated)
- playback, likes, comments and repost counts for top tracks

The geographic and 12-month Insights data currently comes from the saved September 22, 2026 snapshot because those analytics are not exposed by the basic public track/profile endpoints. The adapter is intentionally separated so a private Insights export or additional analytics source can replace the snapshot without touching the UI.

## Structure

```text
app/
  api/soundcloud/route.ts   SoundCloud server adapter
  globals.css               BlackMamba visual system
  layout.tsx
  page.tsx                  main animated dashboard
components/
  MetricCard.tsx
  TrackTable.tsx
  WorldPulse.tsx
data/
  seed.ts                   saved Insights snapshot
lib/
  types.ts
```

## Validation

```bash
npm run typecheck
npm run build
```

GitHub Actions runs both checks on pull requests and on pushes to `main`.

## Next slices

1. Persist hourly/daily snapshots to measure 1h / 3h / 24h / 7d velocity.
2. Replace the abstract global pulse with a full geographic map layer.
3. Add catalog buckets: >10K, 5K–10K, 1K–5K, 100–1K and <100.
4. Add public presentation mode and private strategy/admin mode.
5. Add Spotify, YouTube and other sources behind the same normalized analytics model.
