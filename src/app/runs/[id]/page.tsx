export const dynamic = "force-dynamic"; // receipt ids resolve against the live ledger

// The receipt page — every number on the site resolves here: scores, seeds,
// digests, trust mode, and the command that reproduces the run.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SectionTitle } from "@/components/ui";
import { entrySignature, fmtTs, frontierIntegrity, receipt, transcriptExists } from "@/lib/data";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = receipt(id);
  if (!r) notFound();
  const intact = frontierIntegrity(r.repo);
  const p = r.entry.payload as Record<string, unknown>;
  const payload = JSON.stringify(r.entry.payload, null, 2);
  const txSha = p.transcript_sha256 as string | undefined;
  // The chain-binding section always shows the referenced transcript sha (it's
  // part of what's signed), but only offer the per-task-log LINK if the file is
  // actually published — a receipt can reference a transcript that wasn't
  // committed (or gate splits, intentionally never published) and /tasks 404s.
  const hasLog = txSha != null && transcriptExists(txSha);
  const sig = entrySignature(r.repo, r.entry.sha);

  const reproduce = r.repo === "omakase-router"
    ? `cd omakase-router && scripts/self_score.sh    # split ${(p.split as string) ?? "dev"}, seed ${(p.seed as number) ?? 1}`
    : `cd omakase-harness && scripts/self_score.sh   # paired vs main-baseline`;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="num text-lg font-semibold">receipt {id}</h1>
        <Badge kind={intact ? "pass" : "fail"}>{intact ? "chain intact" : "CHAIN BROKEN"}</Badge>
        <Badge kind="neutral">reproducible + signed logs</Badge>
        {sig && <Badge kind={sig.verified ? "pass" : "fail"}>{sig.verified ? `signed · ${sig.by} ✓` : "signature INVALID"}</Badge>}
      </div>
      <div className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        {r.repo} · {r.entry.kind} · {fmtTs(r.entry.ts)} · seq {r.entry.seq}
      </div>

      {hasLog && (
        <div className="mt-4 flex items-center justify-between rounded-lg px-5 py-4" style={{ background: "color-mix(in srgb, var(--accent) 7%, transparent)", border: "1px solid var(--border)" }}>
          <div className="text-sm" style={{ color: "var(--ink-2)" }}>
            The full per-task runtime log for this run is published — audit every problem, every worker call.
          </div>
          <Link href={`/runs/${txSha}/tasks`} className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
            View per-task log →
          </Link>
        </div>
      )}

      <SectionTitle>Chain binding</SectionTitle>
      <div className="card num overflow-x-auto px-5 py-4 text-xs leading-6" style={{ color: "var(--ink-2)" }}>
        <div>sha&nbsp;&nbsp;{r.entry.sha}</div>
        <div>prev&nbsp;{r.entry.prev}</div>
        {txSha && <div>transcript&nbsp;{txSha}</div>}
      </div>

      <SectionTitle>Payload</SectionTitle>
      <pre className="card overflow-x-auto px-5 py-4 text-xs leading-5" style={{ color: "var(--ink-2)" }}>{payload}</pre>

      <SectionTitle hint="same split, same seed, same pool ⇒ same verdict">Reproduce this</SectionTitle>
      <pre className="card overflow-x-auto px-5 py-4 text-xs" style={{ color: "var(--ink-2)" }}>{reproduce}</pre>
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        can&apos;t reproduce it? one contested re-run per receipt is honored —{" "}
        <Link href="/docs/trust-and-verification" className="underline">the dispute path</Link>.
      </p>
    </div>
  );
}
