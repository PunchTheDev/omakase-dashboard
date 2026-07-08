// Docs index — single-sourced from the competition repos.
import Link from "next/link";
import { CopyPrompt } from "@/components/CopyPrompt";
import { SectionTitle } from "@/components/ui";
import { BOOTSTRAP_PROMPT, DOCS } from "@/lib/docs";

const GROUPS: [string, string[]][] = [
  ["Understand", ["how-it-works", "trust-and-verification", "rules-and-rewards"]],
  ["Mine", ["quickstart", "miner-agent-router", "miner-agent-harness"]],
  ["Reference", ["changelog", "faq"]],
];

export default function DocsIndex() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Docs</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--ink-2)" }}>
        Rendered from the same files agents read in the competition repos — one source of truth.
      </p>
      {GROUPS.map(([group, slugs]) => (
        <div key={group}>
          <SectionTitle>{group}</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {slugs.filter((slug) => DOCS[slug]).map((slug) => (
              <Link key={slug} href={`/docs/${slug}`} className="card px-4 py-3 text-sm hover:underline">
                {DOCS[slug].title}
                <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{DOCS[slug].file}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-10"><CopyPrompt prompt={BOOTSTRAP_PROMPT} /></div>
    </div>
  );
}
