// GET /api/queue — the live FIFO eval queue as the maintainer agent sees it.
import { maintainerMetrics, queue } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ items: queue(), metrics: maintainerMetrics() });
}
