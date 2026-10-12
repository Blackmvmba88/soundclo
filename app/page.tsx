"use client";
import { useEffect, useState } from "react";
import { TrackTable } from "@/components/TrackTable";
import { MetricCard } from "@/components/MetricCard";
import type { TrackMetric } from "@/lib/types";
export default function Home() {
  const [tracks, setTracks] = useState<TrackMetric[]>([]),
    [source, setSource] = useState("Cargando catálogo"),
    [message, setMessage] = useState(""),
    [insights, setInsights] = useState<
      | {
          track_id: string;
          starts: number;
          finishes: number;
          sessions: number;
        }[]
      | null
    >(null);
  async function load() {
    try {
      const r = await fetch("/api/soundcloud");
      const d = await r.json();
      setTracks(d.tracks);
      setSource(d.source);
      setMessage(d.warning ?? "");
    } catch {
      setMessage("No se pudo cargar el catálogo.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function sync() {
    setMessage("Sincronizando todo el catálogo público…");
    try {
      const r = await fetch("/api/catalog/sync", { method: "POST" });
      const d = await r.json();
      setMessage(d.error ?? `${d.imported} pistas importadas`);
      if (r.ok) await load();
    } catch {
      setMessage("No se pudo sincronizar.");
    }
  }
  async function stats() {
    const r = await fetch("/api/insights");
    if (!r.ok) {
      setMessage(
        "Inicia tu sesión privada y configura PostgreSQL para ver tus eventos.",
      );
      return;
    }
    const d = await r.json();
    setInsights(d.tracks);
  }
  return (
    <main>
      <div className="noise" />
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">BM</span>
          <span>
            BLACKMAMBA<small>RECORDS</small>
          </span>
        </a>
        <nav>
          <a href="#catalog">Catálogo</a>
          <a href="#insights">Insights</a>
        </nav>
        <span className="source-pill">{source}</span>
      </header>
      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-copy">
          <span className="eyebrow">IYARI GOMEZ · WORLDWIDE SOUND</span>
          <h1>
            Una casa para<span>nuestro sonido.</span>
          </h1>
          <p>
            Escucha BlackMamba desde el reproductor oficial de SoundCloud.
            Explora canciones, encuentra tu próxima favorita y sigue la señal.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#catalog">
              Explorar catálogo ↓
            </a>
            <span>MUSIC PLATFORM · MVP</span>
          </div>
        </div>
        <div className="hero-orb">
          <div className="orb-ring ring-a" />
          <div className="orb-ring ring-b" />
          <div className="orb-core">
            <span>BLACKMAMBA</span>
            <strong>BM</strong>
            <small>WORLDWIDE SOUND</small>
          </div>
        </div>
      </section>
      <section className="content-section">
        <p role="status">{message}</p>
        <div className="metric-grid">
          <MetricCard
            label="CATÁLOGO IMPORTADO"
            value={String(tracks.length)}
            accent="var(--pink)"
            note="Pistas públicas sincronizadas"
          />
          <MetricCard
            label="PLAYS SOUNDCLOUD"
            value={
              tracks.length
                ? tracks
                    .reduce((n, t) => n + t.plays, 0)
                    .toLocaleString("es-MX")
                : "—"
            }
            accent="var(--orange)"
            note="Contadores acumulados de las pistas importadas"
          />
          <MetricCard
            label="LIKES SOUNDCLOUD"
            value={
              tracks.length
                ? tracks
                    .reduce((n, t) => n + t.likes, 0)
                    .toLocaleString("es-MX")
                : "—"
            }
            accent="var(--violet)"
            note="Snapshot de API; no métricas en tiempo real"
          />
        </div>
      </section>
      <section className="content-section catalog-section" id="catalog">
        <div className="catalog-intro">
          <span className="eyebrow">THE CATALOG</span>
          <h2>Encuentra tu frecuencia.</h2>
          <p>
            {tracks.length
              ? "Audio servido por SoundCloud. Sus reglas determinan qué escuchas acredita."
              : "Todavía no hay pistas importadas. Abre Mi sesión, conecta la cuenta y sincroniza el catálogo."}
          </p>
        </div>
        <TrackTable tracks={tracks} />
        <div className="hero-actions">
          <a className="text-button" href="/api/auth/soundcloud">
            Conectar SoundCloud ↗
          </a>
          <button className="text-button" onClick={sync}>
            Sincronizar todo el catálogo
          </button>
        </div>
      </section>
      <section className="content-section" id="insights">
        <span className="eyebrow">PRIVATE INSIGHTS</span>
        <h2>La señal de tu sitio.</h2>
        <p>
          Eventos propios de los últimos 30 días. Los inicios pueden incluir
          reanudaciones; las sesiones no representan personas únicas. Son datos
          reportados por el navegador, separados de los contadores oficiales.
        </p>
        <button className="primary-button" onClick={stats}>
          Consultar eventos · sesión privada
        </button>
        {insights && (
          <div className="glass" style={{ padding: 24, marginTop: 24 }}>
            {insights.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Pista</th>
                    <th>Inicios</th>
                    <th>Finales</th>
                    <th>Sesiones</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.map((t) => (
                    <tr key={t.track_id}>
                      <td>
                        {tracks.find((x) => x.id === t.track_id)?.title ??
                          t.track_id}
                      </td>
                      <td>{t.starts}</td>
                      <td>{t.finishes}</td>
                      <td>{t.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Sin eventos registrados todavía.</p>
            )}
          </div>
        )}
        <p>
          Países, ciudades y métricas históricas de Creator Insights: pendientes
          de una fuente autorizada. No se muestran valores inventados.
        </p>
      </section>
      <footer>
        <span>BLACKMAMBA RECORDS</span>
        <span>IYARI GOMEZ</span>
        <span>SoundCloud official widget · v0.3</span>
      </footer>
    </main>
  );
}
