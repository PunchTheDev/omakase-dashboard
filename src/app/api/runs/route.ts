// GET /api/runs — every scored run carrying a transcript, newest first.
import { runBlobs } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = runBlobs().map(({ id, competition, blob }) => ({
    id,
    competition,
    split: blob.split,
    seed: blob.seed,
    n_tasks: blob.n_tasks ?? blob.task_summary?.length,
    accuracy: blob.verdict?.candidate?.accuracy ?? blob.accuracy,
    passed: blob.verdict?.passed ?? blob.passed,
    tier: blob.tier ?? null,
    transcript_sha256: blob.transcript_sha256,
  }));
  return Response.json({ runs });
}
