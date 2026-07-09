export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// Router — the router competition. Top: the gist + how the crown accuracy has
// moved. Below: the instrument — pool solo bars, gap analysis, live queue, and a
// searchable history every miner can find their own runs in.
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { FilterTable, type FilterRow } from "@/components/FilterTable";
import { LineChart } from "@/components/LineChart";
import { Badge, Empty, ReceiptLink, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import {
  fmtPct, fmtTs, frontier, gapAnalysis, minerStates, queue, routerBaselines, routerChampionRun, routerConfig,
} from "@/lib/data";

export default function RouterPage() {
  const run = routerChampionRun();
  const base = routerBaselines();
  const cfg = routerConfig();
  const gaps = gapAnalysis();
  const entries = frontier("omakase-router").slice().reverse();
  const merges = entries.filter((e) => e.kind === "merge");
  const gh = new Map(minerStates().map((m) => [m.hotkey, m.github_login]));
  const q = queue().filter((i) => i.competition === "omakase-router");

  // champion accuracy over time (oldest → newest for the chart)
  const history = merges
    .filter((e) => typeof e.payload.accuracy === "number")
    .map((e) => ({ ts: e.ts, value: e.payload.accuracy as number, label: (gh.get(e.payload.hotkey as string) || (e.payload.hotkey as string)?.slice(0, 8)) }))
    .reverse();

  const kinds = [...new Set(entries.map((e) => e.kind))];
  const historyRows: FilterRow[] = entries.map((e) => {
    const p = e.payload as Record<string, unknown>;
    const who = (gh.get(p.hotkey as string) || (p.hotkey as string) || "maintainer") as string;
    return {
      id: e.sha,
      search: `${who} ${(p.label as string) ?? ""} ${e.kind} ${p.pr ?? ""}`,
      tags: [e.kind],
      cells: [
        <span key="t" className="num">{fmtTs(e.ts)}</span>,
        <span key="w">{who}</span>,
        e.kind === "merge" ? <Badge key="e" kind="accent">{(p.label as string) ?? "merge"}</Badge> : <Badge key="e" kind="neutral">{e.kind}</Badge>,
        <span key="a" className="num">{p.accuracy != null ? fmtPct(p.accuracy as number) : "—"}</span>,
        <ReceiptLink key="r" id={e.sha.slice(0, 12)} />,
      ],
    };
  });

  return (
    <div>
      <h1 className="text-lg font-semibold">Router · the orchestrator competition</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--ink-2)" }}>
        Weights-only submissions: a tiny routing model that picks which model answers each task. Beat the
        champion with paired significance; hold the crown, stream emissions.{" "}
        <Link href="/docs/miner-agent-router" className="underline">MINER-AGENT.md</Link> is the full contract.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile accent label="Champion accuracy" value={fmtPct(run?.verdict?.candidate?.accuracy)}
          info="The reigning champion's composite accuracy on the hidden gate benchmark." />
        <StatTile label="Oracle capture" value={run?.verdict?.oracle_capture?.toFixed(2) ?? "—"}
          detail="1.0 = all routing headroom extracted"
          info="Of the gap between the best single model and a perfect router that always picked the best model per task, how much the champion has captured." />
        <StatTile label="Current MDE" value={run?.mde != null ? `${(run.mde * 100).toFixed(1)} pts` : "—"}
          detail="the real entry bar"
          info="Minimum Detectable Effect — an accuracy improvement smaller than this (in percentage points) can't reach statistical significance on the current task count, so it can't win." />
        <StatTile label="Pool" value={cfg?.eval?.pool_version ?? "—"}
          detail={`weight class: ${cfg?.weight_class?.name ?? "—"}`}
          info="The open-weights model pool and weight class this competition orchestrates." />
      </div>

      <SectionTitle hint={history.length >= 2 ? "each point is a crowning" : "history builds as champions are crowned"}>
        Champion accuracy over time
      </SectionTitle>
      {history.length >= 2 ? (
        <div className="card px-5 py-4"><LineChart points={history} /></div>
      ) : (
        <Empty>only one champion so far — the trend line appears once the crown changes hands</Empty>
      )}

      {base?.solo_axes && run?.verdict?.candidate && (
        <>
          <SectionTitle hint="why routing wins — complementary strengths"><span id="pool-solo" className="scroll-mt-24">Champion vs the pool, solo</span></SectionTitle>
          <div className="card px-5 py-4">
            <BarChart
              bars={[
                { label: "champion (routed)", value: run.verdict.candidate.accuracy, highlight: true },
                ...Object.entries(base.solo_axes)
                  .sort(([, a], [, b]) => b.accuracy - a.accuracy)
                  .map(([worker, axes]) => ({
                    label: worker,
                    value: axes.accuracy,
                    detail: Object.entries(axes.per_suite ?? {}).map(([s, v]) => `${s} ${fmtPct(v, 0)}`).join(" · "),
                  })),
                { label: "oracle ceiling", value: base.oracle_accuracy },
              ]}
            />
          </div>
        </>
      )}

      {gaps.length > 0 && (
        <>
          <SectionTitle hint="the intended attack surface — free targeting intel">Gap analysis</SectionTitle>
          <Table head={["suite", "champion", "best solo (pool model)", "gap"]}>
            {gaps.map((g) => (
              <tr key={g.suite}>
                <Td>
                  {run?.transcript_sha256 ? (
                    <Link href={`/runs/${run.transcript_sha256}/tasks?suite=${encodeURIComponent(g.suite)}`}
                      className="hover:underline" style={{ color: "var(--accent)" }}>
                      {g.suite}
                    </Link>
                  ) : g.suite}
                </Td>
                <Td num>{fmtPct(g.champion)}</Td>
                <Td num>
                  {fmtPct(g.bestSolo)}{" "}
                  (<a href="#pool-solo" className="hover:underline" style={{ color: "var(--accent)" }}>{g.bestSoloWorker}</a>)
                </Td>
                <Td num>
                  <span style={{ color: g.gap < 0 ? "var(--critical)" : "var(--good-text)" }}>
                    {g.gap >= 0 ? "+" : ""}{(g.gap * 100).toFixed(1)} pts
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            a negative gap is a suite where routing currently loses to the best solo worker — start there.
            click a suite to open the champion&apos;s per-task log for it; &ldquo;best solo&rdquo; is a pool model
            (not a miner) — its scores come from the published baseline, charted above.
          </p>
        </>
      )}

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
          head={["when", "miner", "event", "accuracy", "receipt"]}
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
