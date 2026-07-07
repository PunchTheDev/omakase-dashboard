// Projection layer: the dashboard owns no truth. Everything here is derived by
// reading the competition repos (frontier logs, run blobs, configs) and is
// rebuildable from scratch — the Postgres ingest slots in behind these same
// functions when webhooks arrive.
import fs from "node:fs";
import path from "node:path";

const WORKSPACE = process.env.OC_WORKSPACE ?? path.join(process.cwd(), "..");

export type FrontierEntry = {
  seq: number;
  prev: string;
  ts: number;
  kind: string;
  payload: Record<string, unknown>;
  sha: string;
};

export type Competition = "oc-router" | "oc-harness";

function read(rel: string): string | null {
  try {
    return fs.readFileSync(path.join(WORKSPACE, rel), "utf8");
  } catch {
    return null;
  }
}

function readJson<T>(rel: string): T | null {
  const raw = read(rel);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function frontier(repo: Competition): FrontierEntry[] {
  const raw = read(`${repo}/runs/frontier.jsonl`);
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as FrontierEntry);
}

// ---- oc-router -------------------------------------------------------------

export type Axes = {
  accuracy: number;
  per_suite: Record<string, number>;
  cost_per_task: number;
  latency_p50_ms: number;
};

export type RouterVerdict = {
  passed: boolean;
  reason: string;
  comparison: { p_value: number; wins: number; losses: number; delta: number; ci_low: number; ci_high: number };
  candidate: Axes;
  baseline: Axes;
  oracle_capture: number | null;
};

export type RouterRun = {
  manifest_sha256: string;
  split: string;
  seed: number;
  n_tasks: number;
  verdict: RouterVerdict;
  mde: number;
};

export type Baselines = {
  best_single: string;
  oracle_accuracy: number;
  solo_axes: Record<string, Axes>;
};

export const routerBaselines = () => readJson<Baselines>("oc-router/runs/baselines.dev.json");
export const routerChampionRun = () => readJson<RouterRun>("oc-router/runs/seed-champion.json");
export const routerConfig = () => readJson<Record<string, never>>("oc-router/oc-router.config.json") as
  | Record<string, any>
  | null;

// ---- oc-harness ------------------------------------------------------------

export type HarnessBaseline = { split: string; seed: number; vector: boolean[]; axes: Axes };

export const harnessBaseline = () => readJson<HarnessBaseline>("oc-harness/runs/main-baseline.json");
export const harnessConfig = () => readJson<Record<string, any>>("oc-harness/oc-harness.config.json");
export const routerPin = () => readJson<{ source: string; weights_sha256: string }>("oc-harness/router-pin.json");

// ---- showcase ---------------------------------------------------------------

export type Showcase = {
  split: string;
  seed: number;
  n_tasks: number;
  contenders: Record<string, { accuracy: number; per_suite: Record<string, number>; cost_per_task: number }>;
};

export const showcase = () => readJson<Showcase>("oc-eval/runs/showcase.dev.json");

// ---- derived views ----------------------------------------------------------

export type Champion = {
  competition: Competition;
  label: string;
  holder: string;
  accuracy: number | null;
  sinceTs: number;
  sha: string;
};

export function champions(): Champion[] {
  const out: Champion[] = [];
  for (const repo of ["oc-router", "oc-harness"] as const) {
    const merges = frontier(repo).filter((e) => e.kind === "merge" || e.kind === "rebaseline");
    const last = merges.at(-1);
    if (last) {
      out.push({
        competition: repo,
        label: (last.payload.label as string) ?? "baseline",
        holder: (last.payload.hotkey as string) ?? "maintainer",
        accuracy: (last.payload.accuracy as number) ?? null,
        sinceTs: last.ts,
        sha: last.sha,
      });
    }
  }
  return out;
}

export type Receipt = { id: string; repo: Competition; entry: FrontierEntry };

export function receipts(): Receipt[] {
  const all: Receipt[] = [];
  for (const repo of ["oc-router", "oc-harness"] as const) {
    for (const entry of frontier(repo)) {
      all.push({ id: entry.sha.slice(0, 12), repo, entry });
    }
  }
  return all.sort((a, b) => b.entry.ts - a.entry.ts);
}

export const receipt = (id: string) => receipts().find((r) => r.id === id) ?? null;

export type GapRow = { suite: string; champion: number; bestSolo: number; bestSoloWorker: string; gap: number };

/** Per-suite champion weakness vs. the strongest solo worker — published targeting intel. */
export function gapAnalysis(): GapRow[] {
  const run = routerChampionRun();
  const base = routerBaselines();
  if (!run || !base) return [];
  return Object.entries(run.verdict.candidate.per_suite).map(([suite, champion]) => {
    let bestSoloWorker = "";
    let bestSolo = 0;
    for (const [worker, axes] of Object.entries(base.solo_axes)) {
      if ((axes.per_suite[suite] ?? 0) > bestSolo) {
        bestSolo = axes.per_suite[suite];
        bestSoloWorker = worker;
      }
    }
    return { suite, champion, bestSolo, bestSoloWorker, gap: champion - bestSolo };
  });
}

export function frontierIntegrity(repo: Competition): boolean {
  let prev = "0".repeat(64);
  for (const e of frontier(repo)) {
    if (e.prev !== prev) return false;
    prev = e.sha;
  }
  return true;
}

export const fmtPct = (x: number | null | undefined, digits = 1) =>
  x == null ? "—" : `${(x * 100).toFixed(digits)}%`;

export const fmtTs = (ts: number) =>
  new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
