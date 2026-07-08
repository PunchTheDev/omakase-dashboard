// GET /api/frontier/:repo — the hash-chained ledger + its verified integrity.
import { frontier, frontierIntegrity, type Competition } from "@/lib/data";

export const dynamic = "force-dynamic";

const REPOS = new Set<Competition>(["oc-router", "oc-harness"]);

export async function GET(_req: Request, ctx: { params: Promise<{ repo: string }> }) {
  const { repo } = await ctx.params;
  if (!REPOS.has(repo as Competition)) return Response.json({ error: "unknown repo" }, { status: 404 });
  const r = repo as Competition;
  return Response.json({ repo: r, integrity: frontierIntegrity(r) ? "intact" : "broken", entries: frontier(r) });
}
