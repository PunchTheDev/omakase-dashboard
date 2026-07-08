export const dynamic = "force-dynamic";

// Ops — maintainer view, projected from Peggy's state store. Public in dev;
// behind auth in production. Read-only: nothing here alters outcomes.
import { Badge, Empty, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import { fmtTs, frontier, frontierIntegrity, maintainerMetrics, minerStates, queue, receipts } from "@/lib/data";

export default function Ops() {
  const repos = ["oc-router", "oc-harness"] as const;
  const m = maintainerMetrics();
  const miners = minerStates();
  const q = queue();

  return (
    <div>
      <h1 className="text-lg font-semibold">Ops</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        Health of the machinery, projected from the maintainer agent&apos;s state store.
        {m && <> Last update {fmtTs(m.updated_ts)}.</>}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Queue depth" value={m?.queue_depth ?? q.length} detail="pure FIFO" />
        <StatTile label="Evals (24h)" value={m?.evals_24h ?? "—"} detail="canonical reruns" />
        <StatTile label="Auto-closes (24h)" value={m?.auto_closes_24h ?? "—"} detail="spam + gate rejects" />
        <StatTile label="Banlist" value={m?.banlist_size ?? "—"} detail="credibility < 0.1" />
      </div>

      <SectionTitle>Ledger integrity</SectionTitle>
      <Table head={["repo", "entries", "hash chain"]}>
        {repos.map((repo) => {
          const ok = frontierIntegrity(repo);
          return (
            <tr key={repo}>
              <Td>{repo}</Td>
              <Td num>{frontier(repo).length}</Td>
              <Td>{ok ? <Badge kind="pass">intact</Badge> : <Badge kind="fail">BROKEN — investigate now</Badge>}</Td>
            </tr>
          );
        })}
      </Table>

      <SectionTitle hint="credibility enforced by the agent, not a doc">Miner credibility</SectionTitle>
      {miners.length ? (
        <Table head={["miner", "hotkey", "credibility", "submissions", "status"]}>
          {miners.map((mn) => (
            <tr key={mn.hotkey}>
              <Td>{mn.github_login}</Td>
              <Td num>{mn.hotkey.slice(0, 10)}…</Td>
              <Td num>{mn.credibility.toFixed(2)}</Td>
              <Td num>{mn.submissions}</Td>
              <Td>{mn.banned ? <Badge kind="fail">banlisted</Badge> : <Badge kind="pass">active</Badge>}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>no miner activity recorded yet</Empty>
      )}

      <SectionTitle>Pool &amp; trust posture</SectionTitle>
      <Table head={["component", "status", "note"]}>
        <tr>
          <Td>worker pool</Td>
          <Td><Badge kind="neutral">dev / mock</Badge></Td>
          <Td>health-gate activates with the production pool — a degraded pool pauses the queue, never scores</Td>
        </tr>
        <tr>
          <Td>trust model</Td>
          <Td><Badge kind="pass">reproduce + signed logs</Badge></Td>
          <Td>every run: signed ledger entry + published per-task transcript; reproducible from source + seed</Td>
        </tr>
      </Table>
      <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
        {receipts().length} ledger entries across both competitions.
      </p>
    </div>
  );
}
