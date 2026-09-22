"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MetricCard } from "@/components/MetricCard";
import { TrackTable } from "@/components/TrackTable";
import { WorldPulse } from "@/components/WorldPulse";
import { seedData } from "@/data/seed";
import type { DashboardData } from "@/lib/types";

function compact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function full(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(seedData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/soundcloud", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: DashboardData) => setData(payload))
      .catch(() => setData(seedData))
      .finally(() => setLoading(false));
  }, []);

  const hottestMonth = useMemo(
    () => data.monthly.reduce((best, item) => (item.plays > best.plays ? item : best), data.monthly[0]),
    [data.monthly]
  );

  return (
    <main>
      <div className="noise" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BlackMamba Insights">
          <span className="brand-mark">BM</span>
          <span>
            BLACKMAMBA
            <small>INSIGHTS</small>
          </span>
        </a>
        <nav>
          <a href="#pulse">Pulse</a>
          <a href="#world">World</a>
          <a href="#catalog">Catalog</a>
        </nav>
        <span className="source-pill">
          <i className={loading ? "loading" : ""} />
          {data.source === "hybrid" ? "SOUNDCLOUD API" : "INSIGHTS SNAPSHOT"}
        </span>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" />
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="eyebrow">IYARI GOMEZ · BLACKMAMBA RECORDS</span>
          <h1>
            El océano
            <span>se está moviendo.</span>
          </h1>
          <p>
            Un catálogo masivo convertido en una experiencia viva: alcance global,
            crecimiento, profundidad y velocidad en una sola superficie.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#world">Explorar el mundo</a>
            <span>Updated {new Date(data.updatedAt).toLocaleDateString("es-MX")}</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-orb"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.15 }}
        >
          <div className="orb-ring ring-a" />
          <div className="orb-ring ring-b" />
          <div className="orb-core">
            <span>12 MONTHS</span>
            <strong>{compact(data.summary.plays)}</strong>
            <small>PLAYS</small>
          </div>
        </motion.div>
      </section>

      <section className="content-section" id="pulse">
        <div className="metric-grid">
          <MetricCard
            label="REPRODUCCIONES"
            value={full(data.summary.plays)}
            accent="var(--orange)"
            note="últimos 12 meses"
          />
          <MetricCard
            label="CRECIMIENTO"
            value={`+${data.summary.growthPct}%`}
            accent="var(--green)"
            note="vs periodo comparable"
          />
          <MetricCard
            label="CATÁLOGO"
            value={full(data.summary.tracks)}
            accent="var(--pink)"
            note="pistas publicadas"
          />
          <MetricCard
            label="LIKES"
            value={full(data.summary.likes)}
            accent="var(--violet)"
            note={`${full(data.summary.reposts)} reposts`}
          />
        </div>

        <div className="chart-grid">
          <motion.div
            className="glass chart-card chart-wide"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">MOMENTUM</span>
                <h2>12 meses de presión.</h2>
              </div>
              <div className="peak-badge">
                PEAK <strong>{hottestMonth.month} · {compact(hottestMonth.plays)}</strong>
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#ff4a00" stopOpacity=".55" />
                      <stop offset="100%" stopColor="#ff2bd6" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8c8fa3", fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,.03)" }}
                    contentStyle={{
                      background: "#11131c",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 14
                    }}
                    formatter={(value) => [Number(value).toLocaleString("es-MX"), "plays"]}
                  />
                  <Bar dataKey="plays" fill="url(#barGradient)" radius={[10, 10, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="glass chart-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="eyebrow">SIGNAL</span>
            <h2>Engagement.</h2>
            <div className="signal-number">{compact(data.summary.likes)}</div>
            <div className="signal-label">likes acumulados en el periodo</div>
            <div className="mini-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8f4dff" stopOpacity=".8" />
                      <stop offset="100%" stopColor="#8f4dff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="plays" stroke="#b58cff" fill="url(#areaGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="signal-split">
              <span><strong>{full(data.summary.comments)}</strong> comments</span>
              <span><strong>{full(data.summary.reposts)}</strong> reposts</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="content-section" id="world">
        <WorldPulse points={data.countries} />

        <div className="cities-strip">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">CITY SIGNAL</span>
              <h2>La profundidad tiene coordenadas.</h2>
            </div>
          </div>
          <div className="city-grid">
            {data.cities.slice(0, 10).map((city, index) => (
              <motion.div
                className="city-card glass"
                key={city.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.035 }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{city.name}</strong>
                <b>{full(city.plays)}</b>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section catalog-section" id="catalog">
        <div className="catalog-intro">
          <span className="eyebrow">THE OCEAN</span>
          <h2>{full(data.summary.tracks)} puertas de entrada.</h2>
          <p>
            Cuanto más bajas, más catálogo aparece. Cada mini onda reproduce la pista desde
            SoundCloud; en tu sesión privada puedes editar sus detalles reales sin salir del dashboard.
          </p>
        </div>
        <TrackTable tracks={data.topTracks} />
      </section>

      <footer>
        <span>BLACKMAMBA RECORDS</span>
        <span>{data.profile.username}</span>
        <span>SoundCloud analytics + player · v0.2</span>
      </footer>
    </main>
  );
}
