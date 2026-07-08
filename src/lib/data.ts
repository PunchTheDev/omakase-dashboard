// Projection layer: the dashboard owns no truth. Everything here is derived by
// reading the competition repos (frontier logs, run blobs, configs) and is
// rebuildable from scratch — the Postgres ingest slots in behind these same
// functions when webhooks arrive.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const WORKSPACE = process.env.OMAKASE_WORKSPACE ?? path.join(process.cwd(), "..");

export type FrontierEntry = {
  seq: number;
  prev: string;
  ts: number;
  kind: string;
  payload: Record<string, unknown>;
  sha: string;
};

export type Competition = "omakase-router" | "omakase-harness";

function read(rel: string): string | null {
  try {
    return fs.readFileSync(path.join(WORKSPACE, rel), "utf8");
  } catch {
    return null;
  }
}

function readJson<T>(rel: string): T | null {
  const raw = read(rel);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null; // a half-written blob must not 500 the whole site
  }
}

export function frontier(repo: Competition): FrontierEntry[] {
  const raw = read(`${repo}/runs/frontier.jsonl`);
  if (!raw) return [];
  const out: FrontierEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as FrontierEntry); // skip a torn last line, don't crash
    } catch {
      break; // a truncated append is always the tail; stop here
    }
  }
  return out;
}

// ---- omakase-router -------------------------------------------------------------

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

export const routerBaselines = () => readJson<Baselines>("omakase-router/runs/baselines.dev.json");
/** The reigning champion's scored run — resolved from the current champion ledger entry. */
export function routerChampionRun(): RunBlob | null {
  const champ = frontier("omakase-router").filter((e) => e.kind === "merge" && e.payload.label === "champion").at(-1);
  const txSha = champ?.payload.transcript_sha256 as string | undefined;
  if (txSha) {
    const run = runByTranscript(txSha);
    if (run) return run.blob;
  }
  return readJson<RunBlob>("omakase-router/runs/seed-champion.json"); // fallback for pre-agent state
}
export const routerConfig = () => readJson<Record<string, never>>("omakase-router/omakase-router.config.json") as
  | Record<string, any>
  | null;

// ---- omakase-harness ------------------------------------------------------------

export type HarnessBaseline = { split: string; seed: number; vector: boolean[]; axes: Axes };

export const harnessBaseline = () => readJson<HarnessBaseline>("omakase-harness/runs/main-baseline.json");
export const harnessConfig = () => readJson<Record<string, any>>("omakase-harness/omakase-harness.config.json");
export const routerPin = () => readJson<{ source: string; weights_sha256: string }>("omakase-harness/router-pin.json");

// ---- showcase ---------------------------------------------------------------

export type Showcase = {
  split: string;
  seed: number;
  n_tasks: number;
  contenders: Record<string, { accuracy: number; per_suite: Record<string, number>; cost_per_task: number }>;
};

export const showcase = () => readJson<Showcase>("omakase-eval/runs/showcase.dev.json");

// ---- runs + transcripts (per-problem drill-down) ---------------------------

export type TaskSummary = { task_id: string; suite: string; correct: boolean; tokens: number; cost: number; n_steps: number };

export type RunBlob = {
  competition: Competition;
  transcript_sha256?: string;
  manifest_sha256?: string;
  split?: string;
  seed?: number;
  n_tasks?: number;
  task_summary?: TaskSummary[];
  verdict?: RouterVerdict;
  tier?: string | null;
  delta?: number;
  accuracy?: number;
  mde?: number;
  [k: string]: unknown;
};

export type Step = { worker: string; role: string; response: string; tokens: number };
export type TaskRecord = {
  task_id: string; suite: string; prompt: string; correct: boolean;
  answer: string; tokens: number; cost: number; latency_ms: number; steps: Step[];
};
export type Transcript = { header: Record<string, unknown>; tasks: TaskRecord[] };

const RUN_DIRS: [Competition, string][] = [
  ["omakase-router", "omakase-router/runs"],
  ["omakase-harness", "omakase-harness/runs"],
];

/** Every run blob carrying a transcript, newest first — the drill-down index. */
export function runBlobs(): { id: string; competition: Competition; blob: RunBlob }[] {
  const out: { id: string; competition: Competition; blob: RunBlob }[] = [];
  for (const [competition, dir] of RUN_DIRS) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(path.join(WORKSPACE, dir));
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith(".json") || f.startsWith("baselines") || f.startsWith("main-baseline")) continue;
      const blob = readJson<RunBlob>(`${dir}/${f}`);
      if (blob?.transcript_sha256) out.push({ id: blob.transcript_sha256, competition, blob: { ...blob, competition } });
    }
  }
  return out;
}

export const runByTranscript = (sha: string) => runBlobs().find((r) => r.id === sha) ?? null;

/** Locate a transcript file by content address across both repos. */
export function transcript(sha: string): Transcript | null {
  for (const [, dir] of RUN_DIRS) {
    const t = readJson<Transcript>(`${dir}/transcripts/${sha}.json`);
    if (t) return t;
  }
  return null;
}

export function taskRecord(sha: string, taskId: string): TaskRecord | null {
  return transcript(sha)?.tasks.find((t) => t.task_id === taskId) ?? null;
}

// ---- maintainer state (queue, spam metrics) --------------------------------
// The maintainer agent (Punch) publishes JSON snapshots the dashboard projects.
// Absent files → empty state, never a crash.

export type QueueItem = {
  competition: Competition; pr: number; hotkey: string; github_login: string;
  status: string; position: number; enqueued_ts: number;
};

export type MaintainerMetrics = {
  queue_depth: number; auto_closes_24h: number; banlist_size: number;
  evals_24h: number; updated_ts: number;
};

export const queue = () => readJson<{ items: QueueItem[] }>("omakase-maintainer/state/queue.json")?.items ?? [];
export const maintainerMetrics = () =>
  readJson<MaintainerMetrics>("omakase-maintainer/state/metrics.json");

export type MinerState = {
  hotkey: string; github_login: string; credibility: number;
  submissions: number; banned: boolean;
};
export const minerStates = () =>
  readJson<{ miners: MinerState[] }>("omakase-maintainer/state/miners.json")?.miners ?? [];

// ---- ledger signatures (maintainer-signed, ed25519) ------------------------

const maintainerPubkey = () =>
  readJson<{ pubkey: string }>("omakase-maintainer/state/maintainer.pub.json")?.pubkey ?? null;

type SigRecord = { alg: string; by: string; pubkey: string; sig: string };

/** Verify one entry's maintainer signature against the published public key. */
export function entrySignature(repo: Competition, entrySha: string): { by: string; verified: boolean } | null {
  const store = readJson<Record<string, SigRecord>>(`${repo}/runs/signatures.json`);
  const rec = store?.[entrySha];
  const pub = maintainerPubkey();
  if (!rec || !pub || rec.pubkey !== pub) return null;
  const verified = crypto.verify(
    null,
    Buffer.from(entrySha),
    { key: Buffer.from(`302a300506032b6570032100${pub}`, "hex"), format: "der", type: "spki" },
    Buffer.from(rec.sig, "hex"),
  );
  return { by: rec.by, verified };
}

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
  for (const repo of ["omakase-router", "omakase-harness"] as const) {
    // The crown is the last *merge* that carried a label. Rebaselines (weekly
    // reset windows, pin bumps) refresh main's score but never re-crown, so
    // they must not overwrite the holder — that would flip every champion card
    // to "maintainer/baseline" every Monday.
    const last = frontier(repo).filter((e) => e.kind === "merge" && e.payload.label).at(-1);
    if (last) {
      out.push({
        competition: repo,
        label: last.payload.label as string,
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
  for (const repo of ["omakase-router", "omakase-harness"] as const) {
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
  const perSuite = run?.verdict?.candidate?.per_suite;
  if (!perSuite || !base?.solo_axes) return [];
  return Object.entries(perSuite).map(([suite, champion]) => {
    let bestSoloWorker = "";
    let bestSolo = 0;
    for (const [worker, axes] of Object.entries(base.solo_axes)) {
      const s = axes.per_suite?.[suite] ?? 0;
      if (s > bestSolo) {
        bestSolo = s;
        bestSoloWorker = worker;
      }
    }
    return { suite, champion, bestSolo, bestSoloWorker, gap: champion - bestSolo };
  });
}

// Canonical encoding mirroring omakase-eval/omakase_eval/frontier.py `_canonical`/`_numstr`
// exactly — numbers use a language-neutral form (integers drop the decimal,
// others use fixed 12-decimal notation) so this reproduces the Python digest.
// Keep the two in lockstep.
function numstr(x: number): string {
  if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x);
  return x.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
}

function canonical(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return numstr(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}`;
}

function digest(e: FrontierEntry): string {
  const { sha, ...body } = e; // eslint-disable-line @typescript-eslint/no-unused-vars
  return crypto.createHash("sha256").update(canonical(body)).digest("hex");
}

/** Recompute each entry's hash and chain — the real tamper check, matching omakase-eval's verifier. */
export function frontierIntegrity(repo: Competition): boolean {
  let prev = "0".repeat(64);
  const entries = frontier(repo);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.seq !== i || e.prev !== prev || e.sha !== digest(e)) return false;
    prev = e.sha;
  }
  return true;
}

export const fmtPct = (x: number | null | undefined, digits = 1) =>
  x == null ? "—" : `${(x * 100).toFixed(digits)}%`;

export const fmtP = (p: number | null | undefined) =>
  p == null ? "—" : p < 0.001 ? p.toExponential(1) : p.toFixed(3);

export const fmtTs = (ts: number | null | undefined) => {
  const d = ts == null ? NaN : new Date(ts * 1000).getTime();
  return Number.isNaN(d) ? "—" : new Date(d).toISOString().replace("T", " ").slice(0, 16) + " UTC";
};
