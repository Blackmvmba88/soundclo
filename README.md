# BlackMamba Insights

Animated SoundCloud analytics + playback for **Iyari Gomez / BlackMamba Records**.

The dashboard turns the catalog into a visual experience and a working curation station: global pulse, catalog depth, SoundCloud playback, missing-artwork detection, missing-metadata detection and private editing.

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

In curation mode the app audits every track and flags missing:

- artwork / cover
- metadata artist
- genre
- tags
- description

The private editor can then update those fields directly on SoundCloud, including uploading replacement artwork. Pending tracks are automatically prioritized with missing artwork first and higher-traffic tracks ahead inside the same priority level.

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

## Roadmap priority

### P0 — Catalog curation
- Detect missing artwork and core metadata across the entire catalog.
- Curate directly from the private session.
- Upload missing covers and save corrected metadata to SoundCloud.
- Work through a priority queue weighted by missing fields and existing traffic.

### P1 — Curation quality
- Batch presets for artist, genre and common tags.
- Album-aware metadata inheritance and consistency checks.
- Duplicate/inconsistent cover detection.
- Curation progress snapshots and completion percentage.

### P2 — Analytics
- Persist hourly/daily snapshots for 1h / 3h / 24h / 7d velocity.
- Full geographic map layer.
- Catalog buckets: >10K, 5K–10K, 1K–5K, 100–1K and <100.

### P3 — Visual playback
- Replace the generic mini sine with each track's real SoundCloud waveform signature.
- Track detail page with waveform, comments and history.

### P4 — Multi-platform
- Normalize Spotify, YouTube and other sources behind the same analytics model.
