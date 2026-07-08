// GET /api/runs/:sha/tasks/:taskId — one problem's full runtime log (every worker call).
import { taskRecord } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ sha: string; taskId: string }> }) {
  const { sha, taskId } = await ctx.params;
  const rec = taskRecord(sha, decodeURIComponent(taskId));
  if (!rec) return Response.json({ error: "task not found" }, { status: 404 });
  return Response.json(rec);
}
