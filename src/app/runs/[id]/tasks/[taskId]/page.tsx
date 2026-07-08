export const dynamic = "force-dynamic";

// One problem's full runtime log: the prompt, every worker call and its role,
// the response, and the grading outcome. The atom of auditable trust.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SectionTitle } from "@/components/ui";
import { taskRecord } from "@/lib/data";

export default async function TaskDetail({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const rec = taskRecord(id, decodeURIComponent(taskId));
  if (!rec) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-baseline gap-3">
        <Link href={`/runs/${id}/tasks`} className="text-xs underline" style={{ color: "var(--muted)" }}>← all tasks</Link>
        <h1 className="num text-lg font-semibold">{rec.task_id}</h1>
        <Badge kind="neutral">{rec.suite}</Badge>
        {rec.correct ? <Badge kind="pass">correct</Badge> : <Badge kind="fail">wrong</Badge>}
      </div>
      <div className="mt-1 num text-xs" style={{ color: "var(--muted)" }}>
        {rec.steps.length} calls · {rec.tokens} tokens · cost {rec.cost.toFixed(4)} · {rec.latency_ms.toFixed(1)}ms
      </div>

      <SectionTitle>Prompt</SectionTitle>
      <pre className="card overflow-x-auto whitespace-pre-wrap px-5 py-4 text-xs" style={{ color: "var(--ink-2)" }}>{rec.prompt}</pre>

      <SectionTitle hint="the router chose each worker + role">Call sequence</SectionTitle>
      <div className="flex flex-col gap-2">
        {rec.steps.map((s, i) => (
          <div key={i} className="card px-4 py-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
              <span className="num" style={{ color: "var(--ink-2)" }}>#{i + 1}</span>
              <Badge kind="accent">{s.worker}</Badge>
              <span>role: {s.role}</span>
              <span className="num ml-auto">{s.tokens} tok</span>
            </div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs" style={{ color: "var(--ink)" }}>{s.response}</pre>
          </div>
        ))}
        {rec.steps.length === 0 && (
          <div className="card px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>no calls — the router forfeited this task</div>
        )}
      </div>

      <SectionTitle>Final answer</SectionTitle>
      <pre className="card overflow-x-auto whitespace-pre-wrap px-5 py-4 text-xs" style={{ color: "var(--ink-2)" }}>{rec.answer || "(none)"}</pre>
    </div>
  );
}
