// Docs are single-sourced from the competition repos; the dashboard renders the
// same files agents read. The slug map is an allowlist — nothing outside it is
// ever served.
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const WORKSPACE = process.env.OC_WORKSPACE ?? path.join(process.cwd(), "..");

export const DOCS: Record<string, { title: string; file: string }> = {
  "how-it-works": { title: "How it works", file: "oc-router/docs/how-it-works.md" },
  quickstart: { title: "Miner quickstart", file: "oc-router/docs/quickstart.md" },
  "miner-agent-oc-r": { title: "MINER-AGENT.md — OC-R", file: "oc-router/MINER-AGENT.md" },
  "miner-agent-oc-h": { title: "MINER-AGENT.md — OC-H", file: "oc-harness/MINER-AGENT.md" },
  "trust-and-verification": { title: "Trust & verification", file: "oc-router/docs/trust-and-verification.md" },
  "rules-and-rewards": { title: "Rules & rewards", file: "oc-router/docs/rules-and-rewards.md" },
  changelog: { title: "Changelog / resets", file: "oc-router/docs/changelog.md" },
  faq: { title: "FAQ", file: "oc-router/docs/faq.md" },
};

export function renderDoc(slug: string): { title: string; html: string } | null {
  const doc = DOCS[slug];
  if (!doc) return null;
  let md: string;
  try {
    md = fs.readFileSync(path.join(WORKSPACE, doc.file), "utf8");
  } catch {
    return null;
  }
  // Rewrite relative repo links to their dashboard equivalents where they exist.
  md = md
    .replaceAll("(../MINER-AGENT.md", "(/docs/miner-agent-oc-r")
    .replaceAll("(MINER-AGENT.md", "(/docs/miner-agent-oc-r")
    .replaceAll("(trust-and-verification.md)", "(/docs/trust-and-verification)")
    .replaceAll("(changelog.md)", "(/docs/changelog)");
  return { title: doc.title, html: marked.parse(md, { async: false }) as string };
}

export const BOOTSTRAP_PROMPT = `You are mining the OC orchestration competitions on Gittensor (SN74).

Goal: produce a submission that beats the current champion.
1. Clone the competition repo and read MINER-AGENT.md in its root. It is the
   authoritative procedure — follow it exactly, never guess schemas.
2. OC-R (router weights): <REPO_URL>/oc-router
   OC-H (harness code):   <REPO_URL>/oc-harness
3. Stop at steps marked HUMAN and ask your operator (wallet, registration,
   GitHub binding). Everything else is yours.
4. Iterate with scripts/self_score.sh until it exits 0, run
   scripts/check_submission.py, then open the PR exactly as specified.

Never edit a PR after opening it. Never touch files outside the mutable
directory. The dashboard at <DASHBOARD_URL> shows queue position, receipts,
and the current minimum detectable effect.`;
