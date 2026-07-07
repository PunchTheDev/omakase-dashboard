"use client";
// Horizontal bar chart: identity on the axis (direct labels), magnitude as
// length. The highlighted entity wears the accent; everything else is neutral —
// color never carries identity here, the labels do. Hover = per-mark tooltip.
import { useState } from "react";

export type Bar = { label: string; value: number; highlight?: boolean; detail?: string };

export function BarChart({ bars, format = (v) => `${(v * 100).toFixed(1)}%`, max }: {
  bars: Bar[];
  format?: (v: number) => string;
  max?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const top = max ?? Math.max(...bars.map((b) => b.value)) * 1.05;
  return (
    <div className="flex flex-col gap-1.5">
      {bars.map((b, i) => (
        <div
          key={b.label}
          className="group relative flex items-center gap-3 py-0.5"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="w-40 shrink-0 truncate text-right text-xs" style={{ color: b.highlight ? "var(--ink)" : "var(--ink-2)", fontWeight: b.highlight ? 600 : 400 }}>
            {b.label}
          </div>
          <div className="relative h-4 flex-1">
            <div className="absolute inset-y-0 left-0 w-full rounded-r" style={{ background: "transparent", borderLeft: "1px solid var(--baseline)" }} />
            <div
              className="absolute inset-y-0.5 left-0 rounded-r"
              style={{
                width: `${(b.value / top) * 100}%`,
                background: b.highlight ? "var(--accent)" : "var(--baseline)",
              }}
            />
          </div>
          <div className="num w-14 shrink-0 text-xs" style={{ color: b.highlight ? "var(--accent-ink)" : "var(--muted)" }}>
            {format(b.value)}
          </div>
          {hover === i && b.detail && (
            <div className="card absolute -top-7 right-16 z-10 px-2 py-1 text-xs shadow-sm" style={{ color: "var(--ink-2)" }}>
              {b.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
