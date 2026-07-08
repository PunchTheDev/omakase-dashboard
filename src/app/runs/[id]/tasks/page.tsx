export const dynamic = "force-dynamic";

// Per-problem drill-down: every task in a run, pass/fail, cost, step count.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import { receiptIdByTranscript, runByTranscript, transcript } from "@/lib/data";

export default async function RunTasks({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ suite?: string; only?: string }>;
}) {
  const { id } = await params; // id == transcript_sha256
  const { suite: suiteFilter, only } = await searchParams;
  const tx = transcript(id);
  if (!tx) notFound();
  const run = runByTranscript(id);
  // The receipt page is keyed by the 12-char ledger-entry id, NOT this 64-char
  // transcript sha — resolve it so "← receipt" doesn't 404. A rejected run that
  // never merged has no ledger entry → no back-link.
  const receiptId = receiptIdByTranscript(id);

  const suites = [...new Set(tx.tasks.map((t) => t.suite))];
  const wrong = tx.tasks.filter((t) => !t.correct).length;
  const totalCost = tx.tasks.reduce((s, t) => s + t.cost, 0);

  let shown = tx.tasks;
  if (suiteFilter) shown = shown.filter((t) => t.suite === suiteFilter);
  if (only === "wrong") shown = shown.filter((t) => !t.correct);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        {receiptId && (
          <Link href={`/runs/${receiptId}`} className="text-xs underline" style={{ color: "var(--muted)" }}>← receipt</Link>
        )}
        <h1 className="num text-lg font-semibold">per-task log · {id.slice(0, 12)}</h1>
        <Badge kind="neutral">{String(run?.competition ?? tx.header.competition ?? "")}</Badge>
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        Every problem the run scored, with its full call sequence one click deep. This is the runtime log
        a miner audits to trust the verdict.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Tasks" value={tx.tasks.length} />
        <StatTile label="Correct" value={`${tx.tasks.length - wrong}/${tx.tasks.length}`} />
        <StatTile label="Wrong" value={wrong} />
        <StatTile label="Total worker cost" value={totalCost.toFixed(3)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link href={`/runs/${id}/tasks`} className="rounded px-2 py-1" style={{ border: "1px solid var(--grid)" }}>all</Link>
        <Link href={`/runs/${id}/tasks?only=wrong`} className="rounded px-2 py-1" style={{ border: "1px solid var(--grid)" }}>wrong only</Link>
        {suites.map((s) => (
          <Link key={s} href={`/runs/${id}/tasks?suite=${s}`} className="rounded px-2 py-1" style={{ border: "1px solid var(--grid)" }}>{s}</Link>
        ))}
      </div>

      <SectionTitle hint={`${shown.length} shown · click a row for the full call sequence`}>Tasks</SectionTitle>
      <Table head={["task", "suite", "result", "answer", "steps", "tokens", "cost"]}>
        {shown.map((t) => (
          <tr key={t.task_id}>
            <Td num>
              <Link href={`/runs/${id}/tasks/${encodeURIComponent(t.task_id)}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                {t.task_id}
              </Link>
            </Td>
            <Td>{t.suite}</Td>
            <Td>{t.correct ? <Badge kind="pass">correct</Badge> : <Badge kind="fail">wrong</Badge>}</Td>
            <Td num>{t.answer.split("\n").pop()?.slice(0, 24) || "—"}</Td>
            <Td num>{t.steps.length}</Td>
            <Td num>{t.tokens}</Td>
            <Td num>{t.cost.toFixed(4)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
