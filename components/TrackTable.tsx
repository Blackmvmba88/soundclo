"use client";

import { motion } from "framer-motion";
import type { TrackMetric } from "@/lib/types";

export function TrackTable({ tracks }: { tracks: TrackMetric[] }) {
  const max = Math.max(...tracks.map((track) => track.plays), 1);

  return (
    <div className="glass track-panel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">CATALOG DEPTH</span>
          <h2>Hits enterrados en el océano.</h2>
        </div>
        <span className="muted">ordenado por plays</span>
      </div>

      <div className="track-list">
        {tracks.map((track, index) => (
          <motion.a
            href={track.permalinkUrl ?? "#"}
            target={track.permalinkUrl ? "_blank" : undefined}
            rel="noreferrer"
            key={track.id}
            className="track-row"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(index * 0.04, 0.3) }}
          >
            <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="track-art">
              {track.artworkUrl ? <img src={track.artworkUrl} alt="" /> : <span>BM</span>}
            </div>
            <div className="track-main">
              <strong>{track.title}</strong>
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
          </motion.a>
        ))}
      </div>
    </div>
  );
}
