CREATE TABLE IF NOT EXISTS sc_connection (
 id integer PRIMARY KEY CHECK (id = 1), token text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS catalog (
 id text PRIMARY KEY, payload jsonb NOT NULL, active boolean NOT NULL DEFAULT true, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listen_events (
 id uuid PRIMARY KEY, session_id uuid NOT NULL, track_id text NOT NULL REFERENCES catalog(id),
 kind text NOT NULL CHECK (kind IN ('PLAY','PAUSE','PROGRESS','FINISH')),
 position_ms integer NOT NULL CHECK(position_ms BETWEEN 0 AND 86400000),
 received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_received ON listen_events(received_at);
CREATE TABLE IF NOT EXISTS enrichment (
 url text PRIMARY KEY, payload jsonb NOT NULL, fetched_at timestamptz NOT NULL DEFAULT now()
);
