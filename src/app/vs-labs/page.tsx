// vs Labs — the investor page: our open-weights stack against the field,
// per-suite breakdown, and the receipts that make it more than a claim.
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { Empty, SectionTitle, Table, Td } from "@/components/ui";
import { fmtPct, showcase } from "@/lib/data";

export default function VsLabs() {
  const show = showcase();
  if (!show) {
    return (
      <div>
        <h1 className="text-lg font-semibold">Our stack vs the labs</h1>
        <div className="mt-6"><Empty>no showcase run yet — the weekly runner publishes here</Empty></div>
      </div>
    );
  }

  const sorted = Object.entries(show.contenders).sort(([, a], [, b]) => b.accuracy - a.accuracy);
  const suites = Object.keys(sorted[0][1].per_suite);
  const ours = sorted.find(([n]) => n.startsWith("oc-stack"));
  const bestOther = sorted.find(([n]) => !n.startsWith("oc-stack"));
  const lead = ours && bestOther ? ours[1].accuracy - bestOther[1].accuracy : null;

  return (
    <div>
      <h1 className="text-lg font-semibold">Our stack vs the labs</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        The champion router + champion harness, orchestrating only open-weights workers, against every
        contender solo on the identical {show.n_tasks}-task suite.
        {lead != null && lead > 0 && (
          <> Current lead over the best non-stack contender: <b className="num" style={{ color: "var(--accent-ink)" }}>+{(lead * 100).toFixed(1)}pp</b>.</>
        )}{" "}
        Unlike self-reported lab numbers, every bar here is reproducible from two integers and a pinned
        image — see <Link href="/docs/trust-and-verification" className="underline">trust &amp; verification</Link>.
      </p>

      <SectionTitle hint={`split ${show.split} · seed ${show.seed}`}>Composite accuracy</SectionTitle>
      <div className="card px-5 py-4">
        <BarChart
          bars={sorted.map(([name, axes]) => ({
            label: name,
            value: axes.accuracy,
            highlight: name.startsWith("oc-stack"),
            detail: `cost/task ${axes.cost_per_task.toFixed(3)}`,
          }))}
        />
      </div>

      <SectionTitle>Per-suite breakdown</SectionTitle>
      <Table head={["contender", ...suites, "composite", "cost/task"]}>
        {sorted.map(([name, axes]) => (
          <tr key={name} style={name.startsWith("oc-stack") ? { background: "color-mix(in srgb, var(--accent) 6%, transparent)" } : undefined}>
            <Td>{name.startsWith("oc-stack") ? <b style={{ color: "var(--ink)" }}>{name}</b> : name}</Td>
            {suites.map((s) => (
              <Td key={s} num>{fmtPct(axes.per_suite[s])}</Td>
            ))}
            <Td num><b>{fmtPct(axes.accuracy)}</b></Td>
            <Td num>{axes.cost_per_task.toFixed(3)}</Td>
          </tr>
        ))}
      </Table>
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        dev mode: lab contenders are deterministic stand-ins; production swaps in real API contenders with
        attested runs. the comparison machinery is identical.
      </p>
    </div>
  );
}
