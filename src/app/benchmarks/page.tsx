export const dynamic = "force-dynamic";

// Benchmarks — how evals work, what to expect, and the exact suite make-up.
import Link from "next/link";
import { Badge, Empty, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import { benchmarks, routerChampionRun } from "@/lib/data";

export default function Benchmarks() {
  const b = benchmarks();
  const run = routerChampionRun();

  return (
    <div>
      <h1 className="text-lg font-semibold">Benchmarks &amp; evaluation</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        How your submission is scored — structured like a Kaggle competition: a public set you tune on, a
        private set that decides the crown.
      </p>

      <SectionTitle>How an eval works</SectionTitle>
      <div className="card px-5 py-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open a PR. Punch (the maintainer agent) verifies your hotkey signature + registration <b>before any compute</b>.</li>
          <li>Cheap gates: locked files unchanged, artifact valid. Fail = closed for free.</li>
          <li>Canonical rerun on the <b>private gate split</b> — a fresh, hidden task set you never see.</li>
          <li>Scored <b>paired</b> against the reigning champion (McNemar): you must beat it with statistical significance.</li>
          <li>Pass → merged, signed into the ledger, you take the crown. Every problem&apos;s runtime log is published.</li>
        </ol>
      </div>

      <SectionTitle hint="what to expect">The bar</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="Gate structure" value="public dev + private gate" detail="self-score freely; the hidden set scores the crown" />
        <StatTile label="Grading" value="objective" detail="MCQ / numeric / exact-match — no LLM judge" />
        <StatTile label="Difficulty target" value="55–75%" detail="best single worker — max routing headroom" />
        <StatTile label="Anti-overfit" value="rotated each round" detail="fresh seeds; retired splits published" />
        <StatTile label="Current MDE" value={run?.mde != null ? `${(run.mde * 100).toFixed(1)}pp` : "—"} detail="gains below this can't reach significance" />
        <StatTile label="Fairness" value="identical for all" detail="same public set; same hidden set nobody sees" />
      </div>

      {b ? (
        <>
          <SectionTitle hint={b.difficulty_target}>Suite composition ({b.name})</SectionTitle>
          <Table head={["suite", "source", "graded", "per split", "why it can't be gamed"]}>
            {b.suites.map((s) => (
              <tr key={s.suite}>
                <Td>{s.suite}</Td>
                <Td><Badge kind="neutral">{s.source}</Badge></Td>
                <Td>{s.graded}</Td>
                <Td num>{s.per_split}</Td>
                <Td>{s.ungameable}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{b.structure}</p>
        </>
      ) : (
        <div className="mt-6"><Empty>benchmark descriptor not published yet</Empty></div>
      )}

      <SectionTitle hint="the validator is for submissions, not iteration">Submission policy</SectionTitle>
      <div className="card px-5 py-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>1 canonical eval per hotkey per 24h.</b> Opening a new PR before your cooldown clears
            <b> resets the 24h timer</b> — spamming the queue is strictly negative-EV.</li>
          <li><b>1 open PR per hotkey</b> per competition; a second auto-closes the first.</li>
          <li><b>Iterate locally.</b> <code>scripts/self_score.sh</code> scores your submission on the public
            dev split — for exact parity, point it at the real pool
            (<code>pool.openrouter.example.json</code>). The queue is for finished submissions, not testing.</li>
          <li>A long queue is fine: your eval will come and reward is earned regardless of wait. Build a
            local autoresearch loop; use the validator only to submit.</li>
        </ul>
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Your cooldown + next-eligible time show on your <Link href="/miners" className="underline">miner profile</Link>.
        </p>
      </div>

      <p className="mt-8 text-sm" style={{ color: "var(--ink-2)" }}>
        Full comparison against the labs on the <Link href="/vs-labs" className="underline">vs Labs</Link> page ·
        audit any scored problem from a <Link href="/router" className="underline">receipt</Link>.
      </p>
    </div>
  );
}
