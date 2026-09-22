"use client";

import { motion } from "framer-motion";
import type { GeoPoint } from "@/lib/types";

function project(lat: number, lon: number) {
  return {
    x: ((lon + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 500
  };
}

export function WorldPulse({ points }: { points: GeoPoint[] }) {
  const max = Math.max(...points.map((point) => point.plays), 1);

  return (
    <div className="world-shell glass">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">GLOBAL PULSE</span>
          <h2>El catálogo está viajando.</h2>
        </div>
        <span className="live-pill"><i /> LIVE MAP</span>
      </div>

      <div className="world-stage">
        <svg viewBox="0 0 1000 500" role="img" aria-label="Mapa abstracto de audiencia global">
          <defs>
            <radialGradient id="oceanGlow">
              <stop offset="0%" stopColor="#ff2bd6" stopOpacity=".28" />
              <stop offset="55%" stopColor="#8f4dff" stopOpacity=".12" />
              <stop offset="100%" stopColor="#05060a" stopOpacity="0" />
            </radialGradient>
            <filter id="blurGlow">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          <ellipse cx="500" cy="250" rx="470" ry="205" fill="url(#oceanGlow)" />
          {[100, 200, 300, 400].map((y) => (
            <line key={y} x1="55" y1={y} x2="945" y2={y} className="map-grid" />
          ))}
          {[150, 300, 450, 600, 750, 900].map((x) => (
            <line key={x} x1={x} y1="55" x2={x} y2="445" className="map-grid" />
          ))}
          <ellipse cx="500" cy="250" rx="445" ry="195" className="map-orbit" />
          <ellipse cx="500" cy="250" rx="445" ry="105" className="map-orbit faint" />

          {points.map((point, index) => {
            const { x, y } = project(point.lat, point.lon);
            const size = 4 + (point.plays / max) * 12;
            return (
              <g key={point.name}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r={size * 2.2}
                  fill="#ff2bd6"
                  opacity={0.12}
                  filter="url(#blurGlow)"
                  animate={{ r: [size * 1.5, size * 2.8, size * 1.5], opacity: [0.08, 0.22, 0.08] }}
                  transition={{ duration: 2.4 + (index % 4) * 0.4, repeat: Infinity }}
                />
                <circle cx={x} cy={y} r={size} fill="#ff6a00" className="map-point" />
                <circle cx={x} cy={y} r={Math.max(2, size * 0.35)} fill="#fff4dc" />
              </g>
            );
          })}
        </svg>

        <div className="world-ranking">
          {points.slice(0, 6).map((point, index) => (
            <motion.div
              key={point.name}
              className="world-row"
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <span className="rank">{String(index + 1).padStart(2, "0")}</span>
              <span>{point.name}</span>
              <strong>{point.plays.toLocaleString("es-MX")}</strong>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
