// The receipt page — every number on the site resolves here: scores, seeds,
// digests, trust mode, and the command that reproduces the run.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SectionTitle } from "@/components/ui";
import { fmtTs, frontierIntegrity, receipt } from "@/lib/data";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = receipt(id);
  if (!r) notFound();
  const intact = frontierIntegrity(r.repo);
  const payload = JSON.stringify(r.entry.payload, null, 2);

  const reproduce = r.repo === "oc-router"
    ? `cd oc-router && scripts/self_score.sh    # split ${(r.entry.payload.split as string) ?? "dev"}, seed ${(r.entry.payload.seed as number) ?? 1}`
    : `cd oc-harness && scripts/self_score.sh   # paired vs main-baseline`;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="num text-lg font-semibold">receipt {id}</h1>
        <Badge kind={intact ? "pass" : "fail"}>{intact ? "chain intact" : "CHAIN BROKEN"}</Badge>
        <Badge kind="neutral">trust mode: local-trusted (dev)</Badge>
      </div>
      <div className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        {r.repo} · {r.entry.kind} · {fmtTs(r.entry.ts)} · seq {r.entry.seq}
      </div>

      <SectionTitle>Chain binding</SectionTitle>
      <div className="card num overflow-x-auto px-5 py-4 text-xs leading-6" style={{ color: "var(--ink-2)" }}>
        <div>sha&nbsp;&nbsp;{r.entry.sha}</div>
        <div>prev&nbsp;{r.entry.prev}</div>
      </div>

      <SectionTitle>Payload</SectionTitle>
      <pre className="card overflow-x-auto px-5 py-4 text-xs leading-5" style={{ color: "var(--ink-2)" }}>{payload}</pre>

      <SectionTitle hint="same split, same seed, same image ⇒ same verdict">Reproduce this</SectionTitle>
      <pre className="card overflow-x-auto px-5 py-4 text-xs" style={{ color: "var(--ink-2)" }}>{reproduce}</pre>
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        can&apos;t reproduce it? one contested re-run per receipt is honored —{" "}
        <Link href="/docs/trust-and-verification" className="underline">the dispute path</Link>.
      </p>
    </div>
  );
}
