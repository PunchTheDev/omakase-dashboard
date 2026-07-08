// GET /api/runs/:sha/tasks — per-task rows for drill-down. ?suite= and ?only=wrong filter.
import { transcript } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ sha: string }> }) {
  const { sha } = await ctx.params;
  const tx = transcript(sha);
  if (!tx) return Response.json({ error: "transcript not found" }, { status: 404 });

  const url = new URL(req.url);
  const suite = url.searchParams.get("suite");
  const only = url.searchParams.get("only"); // "wrong" | "right"
  let tasks = tx.tasks;
  if (suite) tasks = tasks.filter((t) => t.suite === suite);
  if (only === "wrong") tasks = tasks.filter((t) => !t.correct);
  if (only === "right") tasks = tasks.filter((t) => t.correct);

  return Response.json({
    sha,
    header: tx.header,
    count: tasks.length,
    tasks: tasks.map((t) => ({
      task_id: t.task_id, suite: t.suite, correct: t.correct,
      tokens: t.tokens, cost: t.cost, n_steps: t.steps.length, answer: t.answer,
    })),
  });
}
