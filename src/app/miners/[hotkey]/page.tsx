// Miner profile — identity, per-competition standing, cooldown, and a filterable
// activity feed where every row links to its signed receipt.
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterTable, type FilterRow } from "@/components/FilterTable";
import { Badge, ReceiptLink, SectionTitle, StatTile } from "@/components/ui";
import { type Competition, champions, fmtPct, fmtTs, minerStates, receipts } from "@/lib/data";

const niceName = (c: Competition) => (c === "omakase-router" ? "Router" : "Harness");
const pageOf = (c: Competition) => (c === "omakase-router" ? "/router" : "/harness");

export default async function MinerPage({ params }: { params: Promise<{ hotkey: string }> }) {
  const { hotkey } = await params;
  const key = decodeURIComponent(hotkey);
  const rows = receipts().filter((r) => (r.entry.payload.hotkey as string) === key);
  const state = minerStates().find((m) => m.hotkey === key);
  if (!rows.length && !state) notFound();
  const held = champions().filter((c) => c.holder === key);
  const name = state?.github_login || `${key.slice(0, 10)}…`;

  const now = Date.now() / 1000;
  const eligible = state?.next_eligible_ts == null || state.next_eligible_ts <= now;
  const hrsLeft = state?.next_eligible_ts ? Math.max(0, (state.next_eligible_ts - now) / 3600) : 0;

  const perComp = (["omakase-router", "omakase-harness"] as const).map((c) => {
    const rs = rows.filter((r) => r.repo === c);
    return {
      competition: c,
      events: rs.length,
      lastTs: rs.reduce((m, r) => Math.max(m, r.entry.ts), 0),
      label: held.find((h) => h.competition === c)?.label ?? null,
    };
  });

  const activityRows: FilterRow[] = rows.map((r) => {
    const p = r.entry.payload as { accuracy?: number; delta?: number; label?: string };
    const score = p.delta != null ? `Δ ${p.delta >= 0 ? "+" : ""}${(p.delta * 100).toFixed(1)} pts` : p.accuracy != null ? fmtPct(p.accuracy) : "—";
    return {
      id: r.entry.sha,
      search: `${r.repo} ${r.entry.kind} ${p.label ?? ""}`,
      tags: [r.repo],
      cells: [
        <span key="t" className="num">{fmtTs(r.entry.ts)}</span>,
        <span key="c">{niceName(r.repo)}</span>,
        r.entry.kind === "merge" ? <Badge key="e" kind="accent">merge · {p.label}</Badge> : <Badge key="e" kind="neutral">{r.entry.kind}</Badge>,
        <span key="s" className="num">{score}</span>,
        <ReceiptLink key="r" id={r.id} />,
      ],
    };
  });

  return (
    <div>
      <h1 className="num text-lg font-semibold">{name}</h1>
      <div className="num mt-1 text-xs" style={{ color: "var(--muted)" }}>{key}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {held.length
          ? held.map((c) => <Badge key={c.competition} kind="accent">{c.label} · {niceName(c.competition)}</Badge>)
          : <Badge kind="neutral">no labels currently held</Badge>}
      </div>

      {state && (
        <>
          <SectionTitle hint="1 eval / 24h, account-wide · early PR resets the timer">Submission status</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label="Next eligible"
              value={state.banned ? "—" : eligible ? "now" : `${hrsLeft.toFixed(1)}h`}
              detail={state.banned ? "banlisted" : eligible ? "you can submit" : "cooldown active"}
              info="The 24h eval cooldown is account-wide across both competitions. Opening a new PR before it clears resets the timer."
            />
            <StatTile label="Open PR" value={state.in_flight ? "in flight" : "none"}
              info="One open PR per competition. A second PR in the same competition auto-closes the first." />
            <StatTile label="Submissions" value={state.submissions} />
            <StatTile label="Credibility" value={state.banned ? "banlisted" : state.credibility.toFixed(2)}
              info="A trust weight earned by clean, reproducible submissions. Low or banlisted keys are de-prioritized." />
          </div>
        </>
      )}

      <SectionTitle>By competition</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {perComp.map((pc) => (
          <div key={pc.competition} className="card px-5 py-4">
            <div className="flex items-baseline justify-between">
              <Link href={pageOf(pc.competition)} className="text-sm font-semibold hover:underline">{niceName(pc.competition)}</Link>
              {pc.label ? <Badge kind="accent">{pc.label}</Badge> : <span className="text-xs" style={{ color: "var(--muted)" }}>no crown</span>}
            </div>
            <div className="mt-2 flex items-baseline gap-4 text-sm" style={{ color: "var(--ink-2)" }}>
              <span><span className="num font-semibold">{pc.events}</span> ledger events</span>
              <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>{pc.lastTs ? `last ${fmtTs(pc.lastTs)}` : "no activity"}</span>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle hint="filter by competition · every row is a signed receipt">Activity</SectionTitle>
      {activityRows.length ? (
        <FilterTable
          head={["when", "competition", "event", "score", "receipt"]}
          placeholder="search activity…"
          filters={[{ key: "omakase-router", label: "Router" }, { key: "omakase-harness", label: "Harness" }]}
          rows={activityRows}
          empty="no merged activity yet"
        />
      ) : (
        <div className="card px-5 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>no merged activity yet</div>
      )}
    </div>
  );
}
