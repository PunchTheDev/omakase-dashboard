// GET /api/champions — current crown holders per competition.
import { champions } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ champions: champions() });
}
