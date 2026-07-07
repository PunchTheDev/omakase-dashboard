# oc-dashboard

The public face of the OC orchestration competitions: live state for miners,
receipts for skeptics, bar charts for everyone else.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Reads the sibling repos directly (`OC_WORKSPACE`, default `..`): frontier logs,
run blobs, configs, and the docs markdown — the same files agents read.

## Architecture

**The dashboard is a projection with zero authority.** Frontier logs (hash-
chained JSONL committed in the competition repos) + GitHub + chain state are
canonical; every view here is derived in `src/lib/data.ts` and rebuildable from
scratch. Compromising the dashboard can misinform but cannot alter outcomes.

Production path: the same `data.ts` seam ingests wrapper webhooks into
Postgres for the live queue and spam metrics; page components don't change.

## Pages

| Route | What it answers |
|---|---|
| `/` | is it working, who holds the crowns, what's queued |
| `/oc-r` `/oc-h` | per-competition state: lineage, MDE, gap analysis, tiers |
| `/vs-labs` | the investor page: our stack vs the field, receipts attached |
| `/runs/[id]` | the receipt: scores, seeds, chain binding, reproduce command |
| `/miners` | directory + per-hotkey profiles |
| `/docs` | rendered from the competition repos — one source of truth |
| `/ops` | ledger integrity, pool/attestation status (auth in production) |

Design: near-monochrome, one accent, tabular numerals, no marketing gloss.
The landing page must answer *what is this → is it working → how does it
compare* without scrolling twice.
