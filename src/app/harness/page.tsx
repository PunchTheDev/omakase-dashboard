export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// Harness — the harness competition. Top: the bar every PR must clear + how the
// merged accuracy has moved. Below: the one-rule bar, where gains live, live
// queue, and a searchable history.
import Link from "next/link";
import { FilterTable, type FilterRow } from "@/components/FilterTable";
import { LineChart } from "@/components/LineChart";
import { Badge, Empty, ReceiptLink, SectionTitle, StatTile } from "@/components/ui";
import { fmtPct, fmtTs, frontier, harnessBaseline, harnessConfig, minerStates, queue, routerPin } from "@/lib/data";

export default function HarnessPage() {
  const base = harnessBaseline();
  const cfg = harnessConfig();
  const pin = routerPin();
  const entries = frontier("omakase-harness").slice().reverse();
  const gh = new Map(minerStates().map((m) => [m.hotkey, m.github_login]));
  const q = queue().filter((i) => i.competition === "omakase-harness");

  const history = entries
    .filter((e) => e.kind === "merge" && typeof e.payload.accuracy === "number")
    .map((e) => ({ ts: e.ts, value: e.payload.accuracy as number, label: gh.get(e.payload.hotkey as string) || (e.payload.hotkey as string)?.slice(0, 8) }))
    .reverse();

  const kinds = [...new Set(entries.map((e) => e.kind))];
  const historyRows: FilterRow[] = entries.map((e) => {
    const p = e.payload as { accuracy?: number; delta?: number; tier?: string | null; passed?: boolean; label?: string; hotkey?: string; pr?: number };
    const who = (gh.get(p.hotkey ?? "") || p.hotkey || "maintainer") as string;
    return {
      id: e.sha,
      search: `${who} ${p.label ?? ""} ${e.kind} ${p.pr ?? ""}`,
      tags: [e.kind],
      cells: [
        <span key="t" className="num">{fmtTs(e.ts)}</span>,
        <span key="w">{who}</span>,
        e.kind === "merge" ? <Badge key="e" kind="accent">merged · {p.label}</Badge> : <Badge key="e" kind="neutral">{e.kind}</Badge>,
        <span key="d" className="num">{p.delta != null ? `Δ ${p.delta >= 0 ? "+" : ""}${(p.delta * 100).toFixed(1)} pts` : fmtPct(p.accuracy)}</span>,
        <ReceiptLink key="r" id={e.sha.slice(0, 12)} />,
      ],
    };
  });

  return (
    <div>
      <h1 className="text-lg font-semibold">Harness · the orchestration-code competition</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--ink-2)" }}>
        One shared harness, continuously improved. PR a change to <code>harness/</code> that beats main with
        paired significance — any provable improvement takes the crown; hold it, stream emissions.{" "}
        <Link href="/docs/miner-agent-harness" className="underline">MINER-AGENT.md</Link> is the full contract.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile accent label="Main accuracy" value={fmtPct(base?.axes?.accuracy)} detail="the bar every PR must clear"
          info="The current merged harness's accuracy on the hidden benchmark, holding the model/router fixed. Every PR is scored against this." />
        <StatTile label="Cost per task" value={base?.axes?.cost_per_task != null ? base.axes.cost_per_task.toFixed(3) : "—"}
          detail={`band: +${Math.round(((cfg?.eval?.cost_tolerance ?? 1.15) - 1) * 100)}%`}
          info="Average worker-token cost per task. A submission may raise cost only within this band — accuracy gains can't be bought with unlimited spend." />
        <StatTile label="Pinned router" value={pin ? pin.weights_sha256.slice(0, 8) + "…" : "—"} detail={pin?.source}
          info="The harness competition freezes the router to the current Router champion so every harness is judged on the identical model policy. This is its content hash." />
        <StatTile label="Next reset window" value="Mon 00:00 UTC" detail="pin bumps + rotations batch here"
          info="Router-pin bumps and hidden-set rotations are batched to this weekly window so the competition is stable within a round." />
      </div>

      <SectionTitle hint={history.length >= 2 ? "each point is a merge" : "history builds as the harness improves"}>
        Merged accuracy over time
      </SectionTitle>
      {history.length >= 2 ? (
        <div className="card px-5 py-4"><LineChart points={history} /></div>
      ) : (
        <Empty>only one merge so far — the trend line appears as the harness improves</Empty>
      )}

      <SectionTitle hint="one rule — same as Router">The bar</SectionTitle>
      <div className="card px-5 py-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        Beat main with <b>paired statistical significance</b> (McNemar, p &lt;{" "}
        {cfg?.eval?.significance_alpha ?? 0.05}, identical tasks) within the cost band — and the crown is
        yours, <b>regardless of how big the improvement is</b>. Significance is the spam filter: a gain has
        to be larger than run-to-run variance to prove itself, so noise can&apos;t win. Hold the crown and
        stream emissions until the next merge takes it.
      </div>

      <SectionTitle hint="per-suite weaknesses live on the Router page's gap analysis">Where gains live</SectionTitle>
      <div className="card px-5 py-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        Verification passes that catch wrong drafts · confidence-aware escalation (spend budget only where
        the pool disagrees) · cheaper calls at equal accuracy (the cost band is a scoring axis, not a
        suggestion) · the <Link href="/router" className="underline">gap analysis</Link> lists the champion&apos;s
        weakest suites — that list is the intended attack surface.
      </div>

      <SectionTitle hint="pure FIFO — position is public">Eval queue</SectionTitle>
      {q.length ? (
        <FilterTable
          head={["#", "PR", "miner", "status"]}
          placeholder="find a PR or miner…"
          rows={q.map((i) => ({
            id: `${i.pr}`,
            search: `${i.pr} ${i.github_login} ${i.status}`,
            cells: [
              <span key="p" className="num">{i.position}</span>,
              <span key="pr" className="num">#{i.pr}</span>,
              <span key="m">{i.github_login}</span>,
              <Badge key="s" kind="neutral">{i.status}</Badge>,
            ],
          }))}
        />
      ) : (
        <Empty>no pending evaluations — the queue is clear</Empty>
      )}

      <SectionTitle hint="search by miner or PR · filter by event">History</SectionTitle>
      {historyRows.length ? (
        <FilterTable
          head={["when", "miner", "event", "accuracy / delta", "receipt"]}
          placeholder="find a miner, label, or PR…"
          filters={kinds.map((k) => ({ key: k, label: k }))}
          rows={historyRows}
          empty="no history yet"
        />
      ) : (
        <Empty>no history yet</Empty>
      )}
    </div>
  );
}
