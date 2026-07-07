// "Now" — the 30-second page: what is this, is it working, how does it compare.
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { CopyPrompt } from "@/components/CopyPrompt";
import { Badge, Empty, ReceiptLink, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import {
  champions, fmtPct, fmtTs, receipts, routerBaselines, routerChampionRun, showcase,
} from "@/lib/data";
import { BOOTSTRAP_PROMPT } from "@/lib/docs";

export default function Now() {
  const run = routerChampionRun();
  const base = routerBaselines();
  const show = showcase();
  const champs = champions();
  const feed = receipts().slice(0, 8);

  const uplift = run ? run.verdict.candidate.accuracy - run.verdict.baseline.accuracy : null;
  const routerRunId = feed.find((f) => f.entry.kind === "run" && f.repo === "oc-router")?.id;

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        Two permissionless competitions build one product: a tiny <Link href="/oc-r" className="underline">routing model</Link> and
        an <Link href="/oc-h" className="underline">orchestration harness</Link> that together beat any single model in the
        pool. Winners hold the crown and stream emissions until dethroned. Every number below links to a
        rerunnable receipt.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          accent
          label="Routing uplift vs best single"
          value={uplift == null ? "—" : `+${(uplift * 100).toFixed(1)}pp`}
          detail={run && routerRunId ? <>p = {run.verdict.comparison.p_value} · <ReceiptLink id={routerRunId} /></> : "no runs yet"}
        />
        <StatTile
          label="Champion accuracy"
          value={fmtPct(run?.verdict.candidate.accuracy)}
          detail={base ? `best single ${base.best_single}: ${fmtPct(run?.verdict.baseline.accuracy)}` : undefined}
        />
        <StatTile
          label="Oracle capture"
          value={run?.verdict.oracle_capture == null ? "—" : run.verdict.oracle_capture.toFixed(2)}
          detail={base ? `pool ceiling ${fmtPct(base.oracle_accuracy)}` : undefined}
        />
        <StatTile
          label="Minimum detectable effect"
          value={run ? `${(run.mde * 100).toFixed(1)}pp` : "—"}
          detail={run ? `${run.n_tasks} tasks · the real entry fee` : undefined}
        />
      </div>

      <SectionTitle hint="crown = merged on main, streaming emissions">Champions</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {champs.map((c) => (
          <div key={c.competition} className="card px-5 py-4">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-semibold">{c.competition === "oc-router" ? "OC-R · router" : "OC-H · harness"}</div>
              <Badge kind="accent">{c.label}</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-4 text-sm" style={{ color: "var(--ink-2)" }}>
              <span>{c.holder}</span>
              <span className="num">{fmtPct(c.accuracy)}</span>
              <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>since {fmtTs(c.sinceTs)}</span>
            </div>
          </div>
        ))}
        {champs.length === 0 && <Empty>no champions yet — genesis pending</Empty>}
      </div>

      {show && (
        <>
          <SectionTitle hint={`${show.n_tasks} tasks · full suite`}>Our stack vs the field</SectionTitle>
          <div className="card px-5 py-4">
            <BarChart
              bars={Object.entries(show.contenders)
                .sort(([, a], [, b]) => b.accuracy - a.accuracy)
                .map(([name, axes]) => ({
                  label: name,
                  value: axes.accuracy,
                  highlight: name.startsWith("oc-stack"),
                  detail: `cost/task ${axes.cost_per_task.toFixed(3)}`,
                }))}
            />
            <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
              full breakdown on <Link href="/vs-labs" className="underline">vs Labs</Link>
            </div>
          </div>
        </>
      )}

      <SectionTitle hint="pure FIFO — position is public">Eval queue</SectionTitle>
      <Empty>no pending evaluations — submissions are gated the moment they arrive</Empty>

      <SectionTitle>Activity</SectionTitle>
      {feed.length ? (
        <Table head={["when", "competition", "event", "outcome", "receipt"]}>
          {feed.map((r) => {
            const p = r.entry.payload as { verdict?: { passed?: boolean }; passed?: boolean; label?: string };
            const passed = p.verdict?.passed ?? p.passed;
            return (
              <tr key={r.id}>
                <Td num>{fmtTs(r.entry.ts)}</Td>
                <Td>{r.repo}</Td>
                <Td>{r.entry.kind}</Td>
                <Td>
                  {r.entry.kind === "run" ? (
                    passed ? <Badge kind="pass">PASS</Badge> : <Badge kind="fail">FAIL</Badge>
                  ) : (
                    <Badge kind="neutral">{p.label ?? r.entry.kind}</Badge>
                  )}
                </Td>
                <Td><ReceiptLink id={r.id} /></Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty>no activity yet</Empty>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <CopyPrompt prompt={BOOTSTRAP_PROMPT} />
        <Link href="/docs/quickstart" className="text-sm underline" style={{ color: "var(--ink-2)" }}>
          or start mining yourself →
        </Link>
      </div>
    </div>
  );
}
