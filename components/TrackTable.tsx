"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MiniSine } from "@/components/MiniSine";
import { TrackEditor } from "@/components/TrackEditor";
import {
  CURATION_LABELS,
  curationIssues,
  curationScore,
  isCurated,
  type CurationIssue
} from "@/lib/curation";
import type { TrackMetric } from "@/lib/types";

type SoundCloudWidgetInstance = {
  bind: (eventName: string, listener: () => void) => void;
  unbind: (eventName: string) => void;
  play: () => void;
  pause: () => void;
};

type SoundCloudWidgetFactory = {
  (iframe: HTMLIFrameElement): SoundCloudWidgetInstance;
  Events: {
    READY: string;
    PLAY: string;
    PAUSE: string;
    FINISH: string;
    ERROR: string;
  };
};

type CurationFilter = "all" | "pending" | "cover" | "metadata" | "curated";

declare global {
  interface Window {
    SC?: {
      Widget: SoundCloudWidgetFactory;
    };
  }
}

export function TrackTable({ tracks }: { tracks: TrackMetric[] }) {
  const [localTracks, setLocalTracks] = useState(tracks);
  const [activeTrack, setActiveTrack] = useState<TrackMetric | null>(null);
  const [playing, setPlaying] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [editing, setEditing] = useState<TrackMetric | null>(null);
  const [query, setQuery] = useState("");
  const [curationFilter, setCurationFilter] = useState<CurationFilter>("all");
  const [visibleCount, setVisibleCount] = useState(48);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SoundCloudWidgetInstance | null>(null);

  useEffect(() => setLocalTracks(tracks), [tracks]);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const authenticated = Boolean(payload.authenticated);
        setAdmin(authenticated);
        if (authenticated) setCurationFilter("pending");
      })
      .catch(() => setAdmin(false));
  }, []);

  useEffect(() => {
    if (window.SC?.Widget) {
      setScriptReady(true);
      return;
    }

    const existing = document.getElementById("soundcloud-widget-api") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "soundcloud-widget-api";
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.addEventListener("load", () => setScriptReady(true), { once: true });
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !frameLoaded || !activeTrack || !iframeRef.current || !window.SC?.Widget) {
      return;
    }

    const factory = window.SC.Widget;
    const widget = factory(iframeRef.current);
    const events = factory.Events;
    widgetRef.current = widget;

    [events.READY, events.PLAY, events.PAUSE, events.FINISH, events.ERROR].forEach((eventName) => {
      widget.unbind(eventName);
    });

    widget.bind(events.READY, () => {
      setPlaying(true);
      widget.play();
    });
    widget.bind(events.PLAY, () => setPlaying(true));
    widget.bind(events.PAUSE, () => setPlaying(false));
    widget.bind(events.FINISH, () => setPlaying(false));
    widget.bind(events.ERROR, () => setPlaying(false));
  }, [activeTrack, frameLoaded, scriptReady]);

  const curationStats = useMemo(() => {
    const covers = localTracks.filter((track) => curationIssues(track).includes("cover")).length;
    const pending = localTracks.filter((track) => !isCurated(track)).length;
    const curated = localTracks.length - pending;
    const metadata = localTracks.filter((track) =>
      curationIssues(track).some((issue) => issue !== "cover")
    ).length;

    return { covers, pending, curated, metadata };
  }, [localTracks]);

  const filteredTracks = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const byCuration = localTracks.filter((track) => {
      if (!admin || curationFilter === "all") return true;
      const issues = curationIssues(track);

      if (curationFilter === "pending") return issues.length > 0;
      if (curationFilter === "cover") return issues.includes("cover");
      if (curationFilter === "metadata") return issues.some((issue) => issue !== "cover");
      if (curationFilter === "curated") return issues.length === 0;
      return true;
    });

    const bySearch = needle
      ? byCuration.filter((track) =>
          [track.title, track.genre, track.tagList, track.metadataArtist, track.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle))
        )
      : byCuration;

    if (!admin || curationFilter === "all" || curationFilter === "curated") {
      return [...bySearch].sort((a, b) => b.plays - a.plays);
    }

    return [...bySearch].sort((a, b) => curationScore(b) - curationScore(a));
  }, [admin, curationFilter, localTracks, query]);

  const displayedTracks = filteredTracks.slice(0, visibleCount);
  const max = Math.max(...localTracks.map((track) => track.plays), 1);

  const playerSrc = useMemo(() => {
    if (!activeTrack?.permalinkUrl) return "";
    const target = encodeURIComponent(activeTrack.permalinkUrl);
    return `https://w.soundcloud.com/player/?url=${target}&auto_play=true&show_artwork=false&show_comments=false&show_playcount=true&show_user=true&sharing=true&download=false&visual=false&color=ff2bd6`;
  }, [activeTrack]);

  function toggleTrack(track: TrackMetric) {
    if (!track.permalinkUrl) return;

    if (activeTrack?.id === track.id && widgetRef.current) {
      if (playing) widgetRef.current.pause();
      else widgetRef.current.play();
      return;
    }

    widgetRef.current = null;
    setFrameLoaded(false);
    setActiveTrack(track);
    setPlaying(true);
  }

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoginError(false);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setLoginError(true);
      return;
    }

    setAdmin(true);
    setCurationFilter("pending");
    setPassword("");
    setLoginOpen(false);
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAdmin(false);
    setCurationFilter("all");
    setEditing(null);
  }

  function updateTrack(updated: TrackMetric) {
    setLocalTracks((current) =>
      current.map((track) => (track.id === updated.id ? updated : track))
    );
    if (activeTrack?.id === updated.id) setActiveTrack(updated);
  }

  function setFilter(filter: CurationFilter) {
    setCurationFilter(filter);
    setVisibleCount(48);
  }

  return (
    <>
      <div className="glass track-panel">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">
              {admin ? "CATALOG CURATION · PRIORITY QUEUE" : "CATALOG DEPTH · LISTEN INSIDE"}
            </span>
            <h2>{admin ? "Dejar el catálogo curado." : "Hits enterrados en el océano."}</h2>
          </div>
          <div className="catalog-controls">
            <span className="muted">
              {filteredTracks.length.toLocaleString("es-MX")} pistas
            </span>
            {admin ? (
              <>
                <span className="admin-live"><i /> CURATION MODE</span>
                <button className="text-button" type="button" onClick={logout}>Salir</button>
              </>
            ) : (
              <button className="text-button" type="button" onClick={() => setLoginOpen(true)}>
                Mi sesión
              </button>
            )}
          </div>
        </div>

        {admin ? (
          <>
            <div className="curation-stats">
              <button type="button" onClick={() => setFilter("pending")} className={curationFilter === "pending" ? "active" : ""}>
                <span>Pendientes</span>
                <strong>{curationStats.pending}</strong>
              </button>
              <button type="button" onClick={() => setFilter("cover")} className={curationFilter === "cover" ? "active" : ""}>
                <span>Sin portada</span>
                <strong>{curationStats.covers}</strong>
              </button>
              <button type="button" onClick={() => setFilter("metadata")} className={curationFilter === "metadata" ? "active" : ""}>
                <span>Metadata</span>
                <strong>{curationStats.metadata}</strong>
              </button>
              <button type="button" onClick={() => setFilter("curated")} className={curationFilter === "curated" ? "active" : ""}>
                <span>Curadas</span>
                <strong>{curationStats.curated}</strong>
              </button>
              <button type="button" onClick={() => setFilter("all")} className={curationFilter === "all" ? "active" : ""}>
                <span>Todas</span>
                <strong>{localTracks.length}</strong>
              </button>
            </div>
            <p className="curation-rule">
              Prioridad automática: <strong>portada faltante</strong> primero, luego artista, género, tags y descripción; dentro de cada nivel pesan más las canciones con más reproducciones.
            </p>
          </>
        ) : null}

        <div className="catalog-search-row">
          <input
            className="catalog-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(48);
            }}
            placeholder="Buscar canción, género, tag, artista o descripción..."
            aria-label="Buscar en el catálogo"
          />
          <span>
            {displayedTracks.length.toLocaleString("es-MX")} / {filteredTracks.length.toLocaleString("es-MX")}
          </span>
        </div>

        <div className="track-list">
          {displayedTracks.map((track, index) => {
            const active = activeTrack?.id === track.id;
            const playable = Boolean(track.permalinkUrl);
            const issues = curationIssues(track);

            return (
              <motion.div
                key={track.id}
                className={`track-row ${active ? "is-playing" : ""} ${admin && issues.length ? "needs-curation" : ""}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.025, 0.2) }}
              >
                <span className="track-index">{String(index + 1).padStart(2, "0")}</span>

                <button
                  className="wave-play"
                  type="button"
                  disabled={!playable}
                  onClick={() => toggleTrack(track)}
                  aria-label={active && playing ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
                  title={playable ? "Reproducir desde SoundCloud" : "Playback no disponible"}
                >
                  <MiniSine active={active && playing} disabled={!playable} />
                  <span className="wave-state">{active && playing ? "II" : "▶"}</span>
                </button>

                <div className={`track-art ${!track.artworkUrl ? "missing-art" : ""}`}>
                  {track.artworkUrl ? <img src={track.artworkUrl} alt="" /> : <span>NO ART</span>}
                </div>

                <div className="track-main">
                  <div className="track-title-line">
                    <strong>{track.title}</strong>
                    {admin && issues.length ? (
                      <div className="issue-badges">
                        {issues.map((issue: CurationIssue) => (
                          <span key={issue}>{CURATION_LABELS[issue]}</span>
                        ))}
                      </div>
                    ) : null}
                    {track.permalinkUrl ? (
                      <a href={track.permalinkUrl} target="_blank" rel="noreferrer" className="sc-link">
                        SoundCloud ↗
                      </a>
                    ) : null}
                  </div>
                  <div className="track-bar">
                    <span style={{ width: `${Math.max(8, (track.plays / max) * 100)}%` }} />
                  </div>
                </div>

                <div className="track-stat">
                  <strong>{track.plays.toLocaleString("es-MX")}</strong>
                  <span>plays</span>
                </div>

                <div className="track-stat hide-mobile">
                  <strong>{track.likes.toLocaleString("es-MX")}</strong>
                  <span>likes</span>
                </div>

                {admin ? (
                  <button
                    className={`edit-track-button ${issues.length ? "needs-work" : "is-done"}`}
                    type="button"
                    onClick={() => setEditing(track)}
                  >
                    {issues.length ? "CURAR" : "OK"}
                  </button>
                ) : (
                  <span className="source-dot" title="Playback servido por SoundCloud">SC</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {displayedTracks.length < filteredTracks.length ? (
          <button
            className="dive-deeper"
            type="button"
            onClick={() => setVisibleCount((current) => current + 48)}
          >
            DIVE DEEPER · +48 TRACKS
          </button>
        ) : null}
      </div>

      {activeTrack?.permalinkUrl ? (
        <motion.div
          className="soundcloud-dock glass"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <iframe
            ref={iframeRef}
            className="soundcloud-engine"
            title="SoundCloud playback engine"
            src={playerSrc}
            allow="autoplay"
            onLoad={() => setFrameLoaded(true)}
          />
          <button className="dock-play" type="button" onClick={() => toggleTrack(activeTrack)}>
            <MiniSine active={playing} />
            <span>{playing ? "PAUSE" : "PLAY"}</span>
          </button>
          <div className="dock-track">
            <span>NOW STREAMING FROM SOUNDCLOUD</span>
            <strong>{activeTrack.title}</strong>
            <small>{activeTrack.metadataArtist ?? "Iyari Gomez"} · BlackMamba Records</small>
          </div>
          <a className="dock-source" href={activeTrack.permalinkUrl} target="_blank" rel="noreferrer">
            OPEN IN SOUNDCLOUD ↗
          </a>
        </motion.div>
      ) : null}

      {editing ? (
        <TrackEditor
          track={editing}
          onClose={() => setEditing(null)}
          onSaved={updateTrack}
        />
      ) : null}

      {loginOpen ? (
        <div className="editor-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}>
          <form className="admin-login glass" onSubmit={login} onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">PRIVATE SESSION</span>
            <h3>BlackMamba Curation</h3>
            <p>
              Entra para detectar portadas y metadata faltante, priorizar el catálogo y corregir SoundCloud desde aquí.
            </p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
            />
            {loginError ? <span className="editor-error">Contraseña incorrecta.</span> : null}
            <button className="primary-button" type="submit">Entrar a curación</button>
          </form>
        </div>
      ) : null}
    </>
  );
}
