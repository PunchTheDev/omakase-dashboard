export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// "Now" — the 30-second page: what is this, is it working, how does it compare.
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { CopyPrompt } from "@/components/CopyPrompt";
import { Badge, Empty, ReceiptLink, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import {
  champions, fmtP, fmtPct, fmtTs, queue, receipts, routerBaselines, routerChampionRun, showcase,
} from "@/lib/data";
import { BOOTSTRAP_PROMPT } from "@/lib/docs";

export default function Now() {
  const run = routerChampionRun();
  const base = routerBaselines();
  const show = showcase();
  const champs = champions();
  const allReceipts = receipts();
  const feed = allReceipts.slice(0, 8);

  const verdict = run?.verdict;
  const uplift = verdict?.candidate?.accuracy != null && verdict?.baseline?.accuracy != null ? verdict.candidate.accuracy - verdict.baseline.accuracy : null;
  const routerRunId = allReceipts.find(
    (f) => f.repo === "omakase-router" && (f.entry.payload.label === "champion" || f.entry.kind === "run"),
  )?.id;

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        A pool of open models, and two permissionless competitions to orchestrate them better than any
        single one. Winners hold the crown and stream emissions until dethroned; every number links to a
        rerunnable, signed receipt.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="card px-5 py-4">
          <div className="text-sm font-semibold"><Link href="/router" className="hover:underline">OMK-R · Router</Link></div>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
            The <b>brain</b>. Harness is locked, identical for all. You submit tiny router <b>weights</b> that
            pick which worker handles each task. Win by beating the champion&apos;s accuracy.
          </p>
        </div>
        <div className="card px-5 py-4">
          <div className="text-sm font-semibold"><Link href="/harness" className="hover:underline">OMK-H · Harness</Link></div>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
            The <b>body</b>. Router is pinned (the champion), identical for all. You submit orchestration
            <b> code</b> — retries, verification, decomposition. Win by beating main.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
        One freezes the harness and varies the model; the other freezes the model and varies the harness.
        Same pool, same <Link href="/benchmarks" className="underline">benchmark</Link>. → measures policy vs. systems engineering.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          accent
          label="Routing uplift vs best single"
          value={uplift == null ? "—" : `+${(uplift * 100).toFixed(1)}pp`}
          detail={run && routerRunId ? <>p = {fmtP(verdict?.comparison?.p_value)} · <ReceiptLink id={routerRunId} /></> : "no runs yet"}
        />
        <StatTile
          label="Champion accuracy"
          value={fmtPct(run?.verdict?.candidate?.accuracy)}
          detail={base ? `best single ${base.best_single}: ${fmtPct(run?.verdict?.baseline?.accuracy)}` : undefined}
        />
        <StatTile
          label="Oracle capture"
          value={run?.verdict?.oracle_capture == null ? "—" : run.verdict.oracle_capture.toFixed(2)}
          detail={base ? `pool ceiling ${fmtPct(base.oracle_accuracy)}` : undefined}
        />
        <StatTile
          label="Minimum detectable effect"
          value={run?.mde != null ? `${(run.mde * 100).toFixed(1)}pp` : "—"}
          detail={run ? `${run.n_tasks} tasks · the real entry fee` : undefined}
        />
      </div>

      <SectionTitle hint="crown = merged on main, streaming emissions">Champions</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {champs.map((c) => (
          <div key={c.competition} className="card px-5 py-4">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-semibold">{c.competition === "omakase-router" ? "Router" : "Harness"}</div>
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
                  highlight: name.startsWith("omakase-stack"),
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
      {queue().length ? (
        <Table head={["#", "competition", "PR", "miner", "status"]}>
          {queue().map((q) => (
            <tr key={`${q.competition}-${q.pr}`}>
              <Td num>{q.position}</Td>
              <Td>{q.competition}</Td>
              <Td num>#{q.pr}</Td>
              <Td>{q.github_login}</Td>
              <Td><Badge kind="neutral">{q.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>no pending evaluations — the queue is clear</Empty>
      )}

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
