// Miners directory — one row per hotkey seen in the frontier logs.
import Link from "next/link";
import { Badge, Empty, SectionTitle, Table, Td } from "@/components/ui";
import { champions, fmtTs, receipts } from "@/lib/data";

export default function Miners() {
  const champs = champions();
  const byMiner = new Map<string, { events: number; lastTs: number }>();
  for (const r of receipts()) {
    const hotkey = (r.entry.payload.hotkey as string) ?? null;
    if (!hotkey) continue;
    const cur = byMiner.get(hotkey) ?? { events: 0, lastTs: 0 };
    byMiner.set(hotkey, { events: cur.events + 1, lastTs: Math.max(cur.lastTs, r.entry.ts) });
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Miners</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        Every hotkey with recorded activity. Registration is permissionless —{" "}
        <Link href="/docs/quickstart" className="underline">join them</Link>.
      </p>
      <SectionTitle>Directory</SectionTitle>
      {byMiner.size ? (
        <Table head={["hotkey", "labels held", "events", "last active", ""]}>
          {[...byMiner.entries()].map(([hotkey, m]) => (
            <tr key={hotkey}>
              <Td num>{hotkey}</Td>
              <Td>
                {champs.filter((c) => c.holder === hotkey).map((c) => (
                  <Badge key={c.competition} kind="accent">{c.label} · {c.competition}</Badge>
                ))}
              </Td>
              <Td num>{m.events}</Td>
              <Td num>{fmtTs(m.lastTs)}</Td>
              <Td><Link href={`/miners/${encodeURIComponent(hotkey)}`} className="text-xs underline" style={{ color: "var(--accent)" }}>profile</Link></Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>no miner activity yet</Empty>
      )}
    </div>
  );
}
