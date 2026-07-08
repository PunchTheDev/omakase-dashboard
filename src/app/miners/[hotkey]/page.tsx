// Miner profile — labels, cooldown status, and activity from the ledger.
import { notFound } from "next/navigation";
import { Badge, ReceiptLink, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import { champions, fmtTs, minerStates, receipts } from "@/lib/data";

export default async function MinerPage({ params }: { params: Promise<{ hotkey: string }> }) {
  const { hotkey } = await params;
  const key = decodeURIComponent(hotkey);
  const rows = receipts().filter((r) => (r.entry.payload.hotkey as string) === key);
  const state = minerStates().find((m) => m.hotkey === key);
  if (!rows.length && !state) notFound();
  const held = champions().filter((c) => c.holder === key);

  const now = Date.now() / 1000;
  const eligible = state?.next_eligible_ts == null || state.next_eligible_ts <= now;
  const hrsLeft = state?.next_eligible_ts ? Math.max(0, (state.next_eligible_ts - now) / 3600) : 0;

  return (
    <div>
      <h1 className="num text-lg font-semibold">{state?.github_login ?? key}</h1>
      <div className="num mt-1 text-xs" style={{ color: "var(--muted)" }}>{key}</div>
      <div className="mt-2 flex gap-2">
        {held.length
          ? held.map((c) => <Badge key={c.competition} kind="accent">{c.label} · {c.competition}</Badge>)
          : <Badge kind="neutral">no labels currently held</Badge>}
      </div>

      {state && (
        <>
          <SectionTitle hint="1 eval / 24h · early PR resets the timer">Submission status</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Credibility" value={state.banned ? "banlisted" : state.credibility.toFixed(2)} />
            <StatTile label="Open PR" value={state.in_flight ? "in flight" : "none"} />
            <StatTile
              label="Next eligible"
              value={state.banned ? "—" : eligible ? "now" : `${hrsLeft.toFixed(1)}h`}
              detail={eligible ? "you can submit" : "cooldown active"}
            />
            <StatTile label="Submissions" value={state.submissions} />
          </div>
        </>
      )}

      <SectionTitle>Activity</SectionTitle>
      {rows.length ? (
        <Table head={["when", "competition", "event", "receipt"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td num>{fmtTs(r.entry.ts)}</Td>
              <Td>{r.repo}</Td>
              <Td>{r.entry.kind}</Td>
              <Td><ReceiptLink id={r.id} /></Td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="card px-5 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>no merged activity yet</div>
      )}
    </div>
  );
}
