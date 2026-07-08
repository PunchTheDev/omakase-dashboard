// GET /api/runs/:sha — full run blob (verdict + per-task summary) for one transcript.
import { runByTranscript } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ sha: string }> }) {
  const { sha } = await ctx.params;
  const run = runByTranscript(sha);
  if (!run) return Response.json({ error: "run not found" }, { status: 404 });
  return Response.json(run);
}
