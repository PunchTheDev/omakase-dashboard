"use client";
// Minimal time-series line chart (SVG). Identity is the single accent line;
// dots are hoverable for the point's value + date. Y-range auto-fits the data
// with a little padding. Theme-aware. For "champion accuracy over time" and the
// like — a few points, not thousands.
import { useState } from "react";

export type Point = { ts: number; value: number; label?: string };

export function LineChart({
  points,
  height = 160,
  format = (v) => `${(v * 100).toFixed(1)}%`,
}: {
  points: Point[];
  height?: number;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return null;

  const W = 640;
  const H = height;
  const padX = 16;
  const padY = 18;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const yLo = lo - span * 0.15;
  const yHi = hi + span * 0.15;

  const x = (i: number) => padX + (points.length === 1 ? (W - 2 * padX) / 2 : (i / (points.length - 1)) * (W - 2 * padX));
  const y = (v: number) => padY + (1 - (v - yLo) / (yHi - yLo)) * (H - 2 * padY);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${(H - padY).toFixed(1)} L${x(0).toFixed(1)},${(H - padY).toFixed(1)} Z`;
  const fmtDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} preserveAspectRatio="none">
        {[yLo, (yLo + yHi) / 2, yHi].map((gv, k) => (
          <line key={k} x1={padX} x2={W - padX} y1={y(gv)} y2={y(gv)} stroke="var(--grid)" strokeWidth={1} />
        ))}
        <path d={area} fill="var(--accent)" opacity={0.08} />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={hover === i ? 5 : 3.5}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={1.5}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover != null && (
        <div
          className="card pointer-events-none absolute z-20 px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: 0,
            transform: "translate(-50%, -8px)",
            color: "var(--ink)",
          }}
        >
          <div className="num font-semibold">{format(points[hover].value)}</div>
          <div style={{ color: "var(--muted)" }}>{points[hover].label ?? fmtDate(points[hover].ts)}</div>
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--muted)" }}>
        <span>{fmtDate(points[0].ts)}</span>
        {points.length > 1 && <span>{fmtDate(points[points.length - 1].ts)}</span>}
      </div>
    </div>
  );
}
