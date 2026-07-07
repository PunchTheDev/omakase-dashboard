export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// OC-R — the router competition: leaderboard, pool solo bars, gap analysis, MDE.
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { Badge, Empty, ReceiptLink, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import {
  fmtPct, fmtTs, frontier, gapAnalysis, routerBaselines, routerChampionRun, routerConfig,
} from "@/lib/data";

export default function OcR() {
  const run = routerChampionRun();
  const base = routerBaselines();
  const cfg = routerConfig();
  const gaps = gapAnalysis();
  const merges = frontier("oc-router").filter((e) => e.kind === "merge").reverse();

  return (
    <div>
      <h1 className="text-lg font-semibold">OC-R · orchestrator router</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--ink-2)" }}>
        Weights-only submissions. Beat the champion with paired significance; hold the crown, stream
        emissions. <Link href="/docs/miner-agent-oc-r" className="underline">MINER-AGENT.md</Link> is the full contract.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile accent label="Champion accuracy" value={fmtPct(run?.verdict?.candidate?.accuracy)} />
        <StatTile label="Oracle capture" value={run?.verdict?.oracle_capture?.toFixed(2) ?? "—"}
          detail="1.0 = all routing headroom extracted" />
        <StatTile label="Current MDE" value={run ? `${(run.mde * 100).toFixed(1)}pp` : "—"}
          detail="gains below this cannot reach significance" />
        <StatTile label="Pool" value={cfg?.eval?.pool_version ?? "—"}
          detail={`weight class: ${cfg?.weight_class?.name ?? "—"}`} />
      </div>

      <SectionTitle hint="latest first">Champion lineage</SectionTitle>
      {merges.length ? (
        <Table head={["crowned", "holder", "label", "accuracy", "receipt"]}>
          {merges.map((e) => (
            <tr key={e.sha}>
              <Td num>{fmtTs(e.ts)}</Td>
              <Td>{(e.payload.hotkey as string) ?? "—"}</Td>
              <Td><Badge kind="accent">{(e.payload.label as string) ?? "—"}</Badge></Td>
              <Td num>{fmtPct(e.payload.accuracy as number)}</Td>
              <Td><ReceiptLink id={e.sha.slice(0, 12)} /></Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>no champion yet</Empty>
      )}

      {base?.solo_axes && run?.verdict?.candidate && (
        <>
          <SectionTitle hint="why routing wins — complementary strengths">Champion vs the pool, solo</SectionTitle>
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
          <Table head={["suite", "champion", "best solo (worker)", "gap"]}>
            {gaps.map((g) => (
              <tr key={g.suite}>
                <Td>{g.suite}</Td>
                <Td num>{fmtPct(g.champion)}</Td>
                <Td num>{fmtPct(g.bestSolo)} ({g.bestSoloWorker})</Td>
                <Td num>
                  <span style={{ color: g.gap < 0 ? "var(--critical)" : "var(--good-text)" }}>
                    {g.gap >= 0 ? "+" : ""}{(g.gap * 100).toFixed(1)}pp
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            a negative gap is a suite where routing currently loses to the best solo worker — start there.
          </p>
        </>
      )}
    </div>
  );
}
