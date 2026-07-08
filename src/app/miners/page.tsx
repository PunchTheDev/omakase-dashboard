export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// Miners directory — one row per hotkey seen in the frontier logs.
import Link from "next/link";
import { Badge, Empty, SectionTitle, Table, Td } from "@/components/ui";
import { champions, fmtTs, minerStates, receipts } from "@/lib/data";

export default function Miners() {
  const champs = champions();
  const creds = new Map(minerStates().map((m) => [m.hotkey, m]));
  const byMiner = new Map<string, { events: number; lastTs: number; github: string }>();
  for (const m of minerStates()) byMiner.set(m.hotkey, { events: 0, lastTs: 0, github: m.github_login });
  for (const r of receipts()) {
    const hotkey = (r.entry.payload.hotkey as string) ?? null;
    if (!hotkey) continue;
    const cur = byMiner.get(hotkey) ?? { events: 0, lastTs: 0, github: "" };
    byMiner.set(hotkey, { events: cur.events + 1, lastTs: Math.max(cur.lastTs, r.entry.ts), github: cur.github });
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
        <Table head={["miner", "credibility", "labels held", "events", "last active", ""]}>
          {[...byMiner.entries()].map(([hotkey, m]) => {
            const c = creds.get(hotkey);
            return (
              <tr key={hotkey}>
                <Td>{m.github ? <span>{m.github} <span className="num" style={{ color: "var(--muted)" }}>· {hotkey.slice(0, 8)}…</span></span> : <span className="num">{hotkey.slice(0, 12)}…</span>}</Td>
                <Td num>{c ? (c.banned ? <Badge kind="fail">banlisted</Badge> : c.credibility.toFixed(2)) : "—"}</Td>
                <Td>
                  {champs.filter((ch) => ch.holder === hotkey).map((ch) => (
                    <Badge key={ch.competition} kind="accent">{ch.label} · {ch.competition}</Badge>
                  ))}
                </Td>
                <Td num>{m.events}</Td>
                <Td num>{m.lastTs ? fmtTs(m.lastTs) : "—"}</Td>
                <Td><Link href={`/miners/${encodeURIComponent(hotkey)}`} className="text-xs underline" style={{ color: "var(--accent)" }}>profile</Link></Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty>no miner activity yet</Empty>
      )}
    </div>
  );
}
