export const dynamic = "force-dynamic"; // reads sibling repos at request time — never prerender stale ledger state

// OMK-H — the harness competition: main baseline, delta tiers, pinned router.
import Link from "next/link";
import { Badge, Empty, ReceiptLink, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import { fmtPct, fmtTs, frontier, harnessBaseline, harnessConfig, routerPin } from "@/lib/data";

export default function OcH() {
  const base = harnessBaseline();
  const cfg = harnessConfig();
  const pin = routerPin();
  const entries = frontier("omakase-harness").slice().reverse();
  const tiers = cfg?.delta_tiers ?? {};

  return (
    <div>
      <h1 className="text-lg font-semibold">OMK-H · orchestration harness</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--ink-2)" }}>
        One shared harness, continuously improved. PR a change to <code>harness/</code> that beats main with
        paired significance; reward scales with the attested delta.{" "}
        <Link href="/docs/miner-agent-omk-harness" className="underline">MINER-AGENT.md</Link> is the full contract.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile accent label="Main accuracy" value={fmtPct(base?.axes?.accuracy)}
          detail="the bar every PR must clear" />
        <StatTile label="Cost per task" value={base?.axes?.cost_per_task != null ? base.axes.cost_per_task.toFixed(3) : "—"}
          detail={`band: +${Math.round(((cfg?.eval?.cost_tolerance ?? 1.15) - 1) * 100)}%`} />
        <StatTile label="Pinned router" value={pin ? pin.weights_sha256.slice(0, 8) + "…" : "—"}
          detail={pin?.source} />
        <StatTile label="Next reset window" value="Mon 00:00 UTC"
          detail="pin bumps + rotations batch here" />
      </div>

      <SectionTitle hint="all tiers require p &lt; 0.05, paired">Delta tiers</SectionTitle>
      <Table head={["tier", "paired delta", "multiplier", "held"]}>
        {Object.entries(tiers).map(([name, t]) => {
          const tier = t as { min_delta: number; multiplier: number };
          return (
            <tr key={name}>
              <Td><Badge kind="accent">{name}</Badge></Td>
              <Td num>{tier.min_delta > 0 ? `≥ ${(tier.min_delta * 100).toFixed(0)}pp` : "> 0, significant"}</Td>
              <Td num>{tier.multiplier.toFixed(1)}×</Td>
              <Td>until the next merge strips it</Td>
            </tr>
          );
        })}
      </Table>

      <SectionTitle hint="per-suite weaknesses live on OMK-R's gap analysis">Where gains live</SectionTitle>
      <div className="card px-5 py-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        Verification passes that catch wrong drafts · confidence-aware escalation (spend budget only where
        the pool disagrees) · cheaper calls at equal accuracy (the cost band is a scoring axis, not a
        suggestion) · the <Link href="/router" className="underline">gap analysis</Link> lists the champion&apos;s
        weakest suites — that list is the intended attack surface.
      </div>

      <SectionTitle>History</SectionTitle>
      {entries.length ? (
        <Table head={["when", "event", "accuracy / delta", "outcome", "receipt"]}>
          {entries.map((e) => {
            const p = e.payload as { accuracy?: number; delta?: number; tier?: string | null; passed?: boolean; label?: string };
            return (
              <tr key={e.sha}>
                <Td num>{fmtTs(e.ts)}</Td>
                <Td>{e.kind}</Td>
                <Td num>
                  {p.delta != null ? `Δ ${p.delta >= 0 ? "+" : ""}${(p.delta * 100).toFixed(1)}pp` : fmtPct(p.accuracy)}
                </Td>
                <Td>
                  {e.kind === "run" ? (
                    p.passed ? <Badge kind="pass">tier: {p.tier}</Badge> : <Badge kind="fail">no tier</Badge>
                  ) : e.kind === "merge" ? (
                    <Badge kind="accent">merged · {p.label}</Badge>
                  ) : (
                    <Badge kind="neutral">{e.kind}</Badge>
                  )}
                </Td>
                <Td><ReceiptLink id={e.sha.slice(0, 12)} /></Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty>no history yet</Empty>
      )}
    </div>
  );
}
