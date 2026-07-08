export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// Miners directory — one row per hotkey seen in the ledger or maintainer state.
// Identity is the GitHub login (bound + gated at system entry) plus the hotkey;
// miners never set a display name. Searchable so anyone can find themselves.
import Link from "next/link";
import { FilterTable, type FilterRow } from "@/components/FilterTable";
import { Badge, Empty, SectionTitle } from "@/components/ui";
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

  const rows: FilterRow[] = [...byMiner.entries()].map(([hotkey, m]) => {
    const c = creds.get(hotkey);
    const held = champs.filter((ch) => ch.holder === hotkey);
    return {
      id: hotkey,
      search: `${m.github} ${hotkey}`,
      cells: [
        <Link key="m" href={`/miners/${encodeURIComponent(hotkey)}`} className="hover:underline" style={{ color: "var(--accent)" }}>
          {m.github || "unknown"} <span className="num" style={{ color: "var(--muted)" }}>· {hotkey.slice(0, 8)}…</span>
        </Link>,
        <span key="c" className="num">{c ? (c.banned ? <Badge kind="fail">banlisted</Badge> : c.credibility.toFixed(2)) : "—"}</span>,
        <span key="l" className="flex flex-wrap gap-1">
          {held.length ? held.map((ch) => <Badge key={ch.competition} kind="accent">{ch.label}</Badge>) : <span style={{ color: "var(--muted)" }}>—</span>}
        </span>,
        <span key="e" className="num">{m.events}</span>,
        <span key="t" className="num">{m.lastTs ? fmtTs(m.lastTs) : "—"}</span>,
      ],
    };
  });

  return (
    <div>
      <h1 className="text-lg font-semibold">Miners</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        Every hotkey with recorded activity, keyed by its bound GitHub login. Registration is permissionless —{" "}
        <Link href="/docs/quickstart" className="underline">join them</Link>.
      </p>
      <SectionTitle hint="search by GitHub login or hotkey">Directory</SectionTitle>
      {rows.length ? (
        <FilterTable
          head={["miner", "credibility", "labels held", "events", "last active"]}
          placeholder="find a GitHub login or hotkey…"
          rows={rows}
          empty="no miner activity yet"
        />
      ) : (
        <Empty>no miner activity yet</Empty>
      )}
    </div>
  );
}
