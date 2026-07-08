"use client";
// The teaching diagram: the single pipeline both competitions share. Every task
// flows pool → router → harness → verdict → crown. The two competitions freeze
// different halves of it — that contrast is the whole idea, so it's drawn, not
// just described. Each stage is hoverable for a plain-English gloss.
import { useState } from "react";

type Stage = { key: string; title: string; sub: string; gloss: string; owner?: "router" | "harness" };

const STAGES: Stage[] = [
  { key: "pool", title: "Model pool", sub: "many open models", gloss: "A fixed set of open-weights AI models — the 'workers'. Everyone competes using these same models; nobody trains or submits a new model of their own." },
  { key: "router", title: "Router", sub: "picks which model answers", gloss: "A small routing model you submit. It reads each task and hands it to the best worker in the pool — it doesn't answer the task itself, it decides which model should. This is the 'brain'.", owner: "router" },
  { key: "harness", title: "Harness", sub: "the code around the models", gloss: "The orchestration code that calls the workers — retrying, checking drafts, breaking hard tasks into steps. It's not a model; it's the scaffolding around them. This is the 'body'.", owner: "harness" },
  { key: "verdict", title: "Verdict", sub: "scored vs the champion", gloss: "The answer is graded on a hidden task set (objective grading, no AI judge) and compared head-to-head against the reigning champion for statistical significance." },
  { key: "crown", title: "Crown", sub: "holds it · earns emissions", gloss: "Beat the champion and you take the crown, streaming TAO emissions until someone dethrones you. Every verdict is a signed, rerunnable receipt." },
];

export function SystemDiagram() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="card px-5 py-6">
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2 md:flex-col">
            <div
              className="relative flex-1 rounded-lg px-3 py-3 text-center transition-colors md:w-full"
              style={{
                border: `1px solid ${s.owner ? "var(--accent)" : "var(--border)"}`,
                background: hover === s.key ? "color-mix(in srgb, var(--accent) 8%, var(--surface))" : "var(--surface)",
                cursor: "help",
              }}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.key)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${s.title}: ${s.gloss}`}
            >
              <div className="text-xs font-semibold" style={{ color: s.owner ? "var(--accent-ink)" : "var(--ink)" }}>{s.title}</div>
              <div className="mt-0.5 text-[11px] leading-tight" style={{ color: "var(--muted)" }}>{s.sub}</div>
              {hover === s.key && (
                <div
                  role="tooltip"
                  className="card absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 px-3 py-2 text-left text-xs font-normal leading-snug shadow-md"
                  style={{ color: "var(--ink-2)" }}
                >
                  {s.gloss}
                </div>
              )}
            </div>
            {i < STAGES.length - 1 && (
              <span aria-hidden className="shrink-0 text-sm md:rotate-90" style={{ color: "var(--baseline)" }}>→</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg px-4 py-3" style={{ border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 5%, transparent)" }}>
          <div className="text-xs font-semibold" style={{ color: "var(--accent-ink)" }}>Router competition — the brain</div>
          <div className="mt-1 text-xs leading-snug" style={{ color: "var(--ink-2)" }}>
            The harness is frozen and shared. You optimize the <b>router</b> — which model answers each task.
          </div>
        </div>
        <div className="rounded-lg px-4 py-3" style={{ border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 5%, transparent)" }}>
          <div className="text-xs font-semibold" style={{ color: "var(--accent-ink)" }}>Harness competition — the body</div>
          <div className="mt-1 text-xs leading-snug" style={{ color: "var(--ink-2)" }}>
            The router is frozen and shared. You optimize the <b>harness</b> — the code that wraps the models.
          </div>
        </div>
      </div>
      <div className="mt-3 text-center text-[11px]" style={{ color: "var(--muted)" }}>
        one pipeline, two competitions — each freezes half of it so only the other half is measured
      </div>
    </div>
  );
}
