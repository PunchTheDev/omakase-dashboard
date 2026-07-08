export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// The landing page: what Omakase is, how the two competitions work, and the
// proof that orchestrated open models beat the best single one. Explanation-
// first — deep tables live on the two competition pages.
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { CopyPrompt } from "@/components/CopyPrompt";
import { SystemDiagram } from "@/components/SystemDiagram";
import { Badge, ReceiptLink, SectionTitle } from "@/components/ui";
import {
  type Competition, champions, fmtPct, fmtTs, frontier, minerStates, queue, routerBaselines,
  routerChampionRun, showcase,
} from "@/lib/data";
import { BOOTSTRAP_PROMPT } from "@/lib/docs";

const REPO_URL = "https://github.com/PunchTheDev";
const niceName = (c: Competition) => (c === "omakase-router" ? "Router" : "Harness");

type ChampCard = {
  competition: Competition; label: string; hotkey: string; github: string;
  accuracy: number | null; pr: number | null; receiptId: string; sinceTs: number;
};

function championCards(): ChampCard[] {
  const gh = new Map(minerStates().map((m) => [m.hotkey, m.github_login]));
  const out: ChampCard[] = [];
  for (const repo of ["omakase-router", "omakase-harness"] as const) {
    const last = frontier(repo).filter((e) => e.kind === "merge" && e.payload.label).at(-1);
    if (!last) continue;
    const hotkey = (last.payload.hotkey as string) ?? "";
    out.push({
      competition: repo,
      label: last.payload.label as string,
      hotkey,
      github: gh.get(hotkey) ?? "",
      accuracy: (last.payload.accuracy as number) ?? null,
      pr: (last.payload.pr as number) ?? null,
      receiptId: last.sha.slice(0, 12),
      sinceTs: last.ts,
    });
  }
  return out;
}

export default function Home() {
  const run = routerChampionRun();
  const base = routerBaselines();
  const show = showcase();
  const cards = championCards();
  const q = queue();
  const depth = (c: Competition) => q.filter((i) => i.competition === c).length;

  const verdict = run?.verdict;
  const championAcc = verdict?.candidate?.accuracy ?? null;
  const bestSingle = verdict?.baseline?.accuracy ?? null;
  const uplift = championAcc != null && bestSingle != null ? championAcc - bestSingle : null;

  return (
    <div>
      {/* Hero */}
      <div className="max-w-3xl pt-2">
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Orchestration competitions · Gittensor SN74
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          The best AI isn&apos;t one model.<br />It&apos;s how you orchestrate many.
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Omakase gives everyone the same pool of open-weights models and one goal: <b>beat the best single
          model</b> on a hidden benchmark by orchestrating the pool better. Do it by <b>routing</b> each task
          to the right model, or by writing a smarter <b>harness</b> around them. Winners hold the crown and
          earn emissions until they&apos;re beaten — and every result is a signed receipt anyone can rerun.
        </p>
      </div>

      {/* The two competitions — the two ways to win, defined up front */}
      <SectionTitle hint="two ways to win · pick one">The two competitions</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/router" className="card group px-5 py-5 transition-colors hover:border-[color:var(--accent)]" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-baseline gap-2">
            <div className="text-base font-semibold">Router</div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>the brain</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            You submit a small <b>routing model</b> — it reads each task and picks which open model in the
            pool should answer it. Everyone runs the <b>same fixed harness</b>, so the only thing measured is
            your routing. Beat the champion&apos;s accuracy to take the crown.
          </p>
          <div className="mt-3 text-xs font-medium group-hover:underline" style={{ color: "var(--accent)" }}>Explore the Router competition →</div>
        </Link>
        <Link href="/harness" className="card group px-5 py-5 transition-colors hover:border-[color:var(--accent)]" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-baseline gap-2">
            <div className="text-base font-semibold">Harness</div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>the body</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            You submit <b>orchestration code</b> — how the models are called: retries, verification, breaking
            hard tasks into steps. Everyone runs the <b>same fixed router and models</b>, so the only thing
            measured is your code. Beat the current best to take the crown.
          </p>
          <div className="mt-3 text-xs font-medium group-hover:underline" style={{ color: "var(--accent)" }}>Explore the Harness competition →</div>
        </Link>
      </div>

      {/* How it works */}
      <SectionTitle hint="hover any stage">How it works</SectionTitle>
      <SystemDiagram />

      {/* The proof */}
      {show?.contenders && Object.keys(show.contenders).length > 0 && (
        <>
          <SectionTitle hint={`identical ${show.n_tasks}-task benchmark`}>Does it work?</SectionTitle>
          <div className="card px-5 py-5">
            <p className="mb-4 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
              Our champion stack — open models, orchestrated — scores{" "}
              <b className="num" style={{ color: "var(--accent-ink)" }}>{fmtPct(championAcc)}</b>
              {bestSingle != null && (
                <>, a <b className="num" style={{ color: "var(--accent-ink)" }}>+{uplift != null ? (uplift * 100).toFixed(1) : "—"}pp</b> lift over the best single model ({fmtPct(bestSingle)})</>
              )}
              , and holds its own against the closed frontier labs. Unlike self-reported numbers,{" "}
              <b>every bar reproduces from source</b>.
            </p>
            <BarChart
              bars={Object.entries(show.contenders)
                .sort(([, a], [, b]) => (b.accuracy ?? 0) - (a.accuracy ?? 0))
                .map(([name, axes]) => ({
                  label: name,
                  value: axes.accuracy ?? 0,
                  highlight: name.startsWith("omakase-stack"),
                  detail: axes.cost_per_task != null ? `cost/task ${axes.cost_per_task.toFixed(3)}` : undefined,
                }))}
            />
            <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
              full per-suite breakdown on <Link href="/showcase" className="underline">Showcase</Link>
            </div>
          </div>
        </>
      )}

      {/* Live now — champions + queue */}
      <SectionTitle hint="the crown = merged on main, streaming emissions">Champions, live</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.competition} className="card px-5 py-4">
            <div className="flex items-baseline justify-between">
              <Link href={c.competition === "omakase-router" ? "/router" : "/harness"} className="text-sm font-semibold hover:underline">
                {niceName(c.competition)}
              </Link>
              <Badge kind="accent">{c.label}</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="num text-2xl font-semibold" style={{ color: "var(--accent)" }}>{fmtPct(c.accuracy)}</span>
              <span className="text-sm" style={{ color: "var(--ink-2)" }}>
                held by{" "}
                <Link href={`/miners/${encodeURIComponent(c.hotkey)}`} className="hover:underline" style={{ color: "var(--ink)" }}>
                  {c.github || `${c.hotkey.slice(0, 8)}…`}
                </Link>
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              {c.pr != null && (
                <a href={`${REPO_URL}/${c.competition}/pull/${c.pr}`} target="_blank" rel="noreferrer"
                  className="hover:underline" style={{ color: "var(--accent)" }}>
                  view contribution ↗
                </a>
              )}
              <span style={{ color: "var(--muted)" }}>receipt <ReceiptLink id={c.receiptId} /></span>
              <span className="ml-auto" style={{ color: "var(--muted)" }}>{depth(c.competition)} in queue · since {fmtTs(c.sinceTs)}</span>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="card px-5 py-8 text-center text-sm md:col-span-2" style={{ color: "var(--muted)" }}>
            no champions yet — genesis pending
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <CopyPrompt prompt={BOOTSTRAP_PROMPT} />
        <Link href="/docs/quickstart" className="text-sm underline" style={{ color: "var(--ink-2)" }}>
          or start mining yourself →
        </Link>
      </div>
    </div>
  );
}
