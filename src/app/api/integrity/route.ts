// GET /api/integrity — recomputed hash-chain status of both ledgers.
import { frontier, frontierIntegrity } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const repos = (["oc-router", "oc-harness"] as const).map((repo) => ({
    repo,
    entries: frontier(repo).length,
    integrity: frontierIntegrity(repo) ? "intact" : "broken",
  }));
  return Response.json({ repos });
}
