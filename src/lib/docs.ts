// Docs are single-sourced from the competition repos; the dashboard renders the
// same files agents read. The slug map is an allowlist — nothing outside it is
// ever served.
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const WORKSPACE = process.env.OMAKASE_WORKSPACE ?? path.join(process.cwd(), "..");

export const DOCS: Record<string, { title: string; file: string }> = {
  "how-it-works": { title: "How it works", file: "omakase-router/docs/how-it-works.md" },
  quickstart: { title: "Miner quickstart", file: "omakase-router/docs/quickstart.md" },
  "miner-agent-omk-router": { title: "MINER-AGENT.md — OMK-R (Router)", file: "omakase-router/MINER-AGENT.md" },
  "miner-agent-omk-harness": { title: "MINER-AGENT.md — OMK-H (Harness)", file: "omakase-harness/MINER-AGENT.md" },
  "trust-and-verification": { title: "Trust & verification", file: "omakase-router/docs/trust-and-verification.md" },
  "rules-and-rewards": { title: "Rules & rewards", file: "omakase-router/docs/rules-and-rewards.md" },
  changelog: { title: "Changelog / resets", file: "omakase-router/docs/changelog.md" },
  faq: { title: "FAQ", file: "omakase-router/docs/faq.md" },
};

// Repo-relative link → dashboard route. Applied to both omakase-router and omakase-harness
// doc link spellings so no rendered doc points at a 404. `self` is the doc's own
// MINER-AGENT route so a bare `(MINER-AGENT.md` self-link stays on this page.
function rewriteLinks(md: string, self: string): string {
  const rules: [string, string][] = [
    ["(../omakase-router/MINER-AGENT.md", "(/docs/miner-agent-omk-router"],
    ["(../omakase-router/docs/quickstart.md)", "(/docs/quickstart)"],
    ["(../omakase-router/docs)", "(/docs)"],
    ["(../omakase-router)", "(/docs/miner-agent-omk-router)"],
    ["(../MINER-AGENT.md", `(${self}`],
    ["(MINER-AGENT.md", `(${self}`],
    ["(trust-and-verification.md)", "(/docs/trust-and-verification)"],
    ["(changelog.md)", "(/docs/changelog)"],
  ];
  for (const [from, to] of rules) md = md.replaceAll(from, to);
  return md;
}

// Neutralize the two markdown→HTML XSS vectors marked passes through. Docs are
// repo-controlled (hash-locked in the competition repos), so this is defense in
// depth, not the primary boundary — but the dashboard shouldn't trust upstream
// blindly. Strips raw <script>, inline event handlers, and javascript: URLs.
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

export function renderDoc(slug: string): { title: string; html: string } | null {
  const doc = DOCS[slug];
  if (!doc) return null;
  let md: string;
  try {
    md = fs.readFileSync(path.join(WORKSPACE, doc.file), "utf8");
  } catch {
    return null;
  }
  const self = slug === "miner-agent-omk-harness" ? "/docs/miner-agent-omk-harness" : "/docs/miner-agent-omk-router";
  const html = marked.parse(rewriteLinks(md, self), { async: false }) as string;
  return { title: doc.title, html: sanitize(html) };
}

const REPO_BASE = process.env.OC_REPO_BASE ?? "https://github.com/entrius";
const DASHBOARD_URL = process.env.OC_DASHBOARD_URL ?? "http://localhost:3000";

export const BOOTSTRAP_PROMPT = `You are mining the OC orchestration competitions on Gittensor (SN74).

Goal: produce a submission that beats the current champion.
1. Clone the competition repo and read MINER-AGENT.md in its root. It is the
   authoritative procedure — follow it exactly, never guess schemas.
2. OMK-R (router weights): ${REPO_BASE}/omakase-router
   OMK-H (harness code):   ${REPO_BASE}/omakase-harness
3. Stop at steps marked HUMAN and ask your operator (wallet, registration,
   GitHub binding). Everything else is yours.
4. Iterate with scripts/self_score.sh until it exits 0, run
   scripts/check_submission.py, then open the PR exactly as specified.

Never edit a PR after opening it. Never touch files outside the mutable
directory. The dashboard at ${DASHBOARD_URL} shows queue position, receipts,
and the current minimum detectable effect.`;
