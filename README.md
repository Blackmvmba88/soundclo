# BlackMamba Insights

Animated SoundCloud analytics + playback for **Iyari Gomez / BlackMamba Records**.

The dashboard turns the catalog into a visual experience: global pulse, 12-month momentum, catalog depth, top tracks, mini sinusoidal playback controls and a private edit session.

## Stack

- Next.js 15
- React 19
- TypeScript
- Framer Motion
- Recharts
- SoundCloud Widget API
- Server-side SoundCloud API adapter

## Run locally

```bash
git clone https://github.com/Blackmvmba88/soundclo.git
cd soundclo
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## SoundCloud API

Configure:

```env
SOUNDCLOUD_ACCESS_TOKEN=your_token_here
SOUNDCLOUD_API_BASE=https://api.soundcloud.com
BLACKMAMBA_ADMIN_PASSWORD=choose_a_private_password
BLACKMAMBA_SESSION_SECRET=choose_a_long_random_secret
```

**Never commit real credentials.** `.env*` files are ignored by Git.

The server adapter pulls the authenticated profile and catalog. The browser never receives the private OAuth token.

## Playback

Each playable catalog row has a mini sinusoidal control. Playback is delegated to the official SoundCloud HTML5 widget, while BlackMamba renders the custom visual controls.

The UI also provides a visible SoundCloud source link for the active track. SoundCloud remains the streaming source and decides how playback is qualified/counts in its own analytics.

## Private edit session

Select **Mi sesión** in the catalog, enter `BLACKMAMBA_ADMIN_PASSWORD`, and the server issues an HTTP-only signed session cookie.

In edit mode the track editor can update these SoundCloud fields through the authenticated server route:

- title
- metadata artist
- genre
- tags
- description

Public visitors can listen but cannot access write controls or the OAuth token.

## Current analytics model

The geographic and 12-month Insights data currently comes from the saved September 22, 2026 snapshot. Live profile, catalog and top-track data come from SoundCloud when an access token is configured.

## Structure

```text
app/
  api/admin/session/route.ts
  api/soundcloud/route.ts
  api/soundcloud/tracks/[id]/route.ts
  globals.css
  page.tsx
components/
  MetricCard.tsx
  MiniSine.tsx
  TrackEditor.tsx
  TrackTable.tsx
  WorldPulse.tsx
data/
  seed.ts
lib/
  admin-session.ts
  types.ts
```

## Validation

```bash
npm run typecheck
npm run build
```

GitHub Actions runs both checks on pull requests and pushes to `main`.

## Next slices

1. Persist hourly/daily snapshots for 1h / 3h / 24h / 7d velocity.
2. Full geographic map layer.
3. Catalog buckets: >10K, 5K–10K, 1K–5K, 100–1K and <100.
4. Track detail page with artwork, waveform, comments and history.
5. Multi-platform normalization for Spotify / YouTube / other sources.
