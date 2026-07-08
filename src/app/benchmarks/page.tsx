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
        How your submission is scored: a <b>public set you tune on freely</b>, and a <b>private hidden set
        that decides the crown</b> — you never see it, so you can&apos;t overfit to it.
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Grading" value="objective" detail="MCQ / numeric / exact-match — no LLM judge"
          info="Every task has one correct answer, checked mechanically. There is no model-graded scoring, so verdicts are deterministic and reproducible." />
        <StatTile label="Difficulty" value="55–75%" detail="best single model accuracy"
          info="Suites are tuned so the best single model lands in this band — hard enough that smart routing and orchestration have real headroom to win." />
        <StatTile label="Anti-overfit" value="rotated each round" detail="fresh hidden seeds; retired splits published"
          info="The hidden gate set is regenerated each round from a secret seed, so you can't memorize it. Retired splits are published afterward for auditing." />
        <StatTile label="Entry bar (MDE)" value={run?.mde != null ? `${(run.mde * 100).toFixed(1)}pp` : "—"} detail="smallest provable gain"
          info="Minimum Detectable Effect: an improvement smaller than this can't reach statistical significance on the current task count, so it can't win." />
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

      <section id="submission-policy" className="scroll-mt-24">
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
      </section>

      <p className="mt-8 text-sm" style={{ color: "var(--ink-2)" }}>
        Full comparison against the labs on the <Link href="/showcase" className="underline">Showcase</Link> page ·
        audit any scored problem from a <Link href="/router" className="underline">receipt</Link>.
      </p>
    </div>
  );
}
