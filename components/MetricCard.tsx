"use client";

import { motion } from "framer-motion";

type MetricCardProps = {
  label: string;
  value: string;
  accent?: string;
  note?: string;
};

export function MetricCard({ label, value, accent = "var(--hot)", note }: MetricCardProps) {
  return (
    <motion.article
      className="metric-card glass"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <span className="metric-kicker">{label}</span>
      <strong className="metric-value" style={{ textShadow: `0 0 28px ${accent}` }}>
        {value}
      </strong>
      {note ? <span className="metric-note">{note}</span> : null}
      <div className="metric-line" style={{ background: accent }} />
    </motion.article>
  );
}
