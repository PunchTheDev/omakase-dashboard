// Ops — maintainer view. Public in dev; behind auth in production (read-only
// projection either way: nothing here can alter competition outcomes).
import { Badge, SectionTitle, StatTile, Table, Td } from "@/components/ui";
import { frontier, frontierIntegrity, receipts } from "@/lib/data";

export default function Ops() {
  const repos = ["oc-router", "oc-harness"] as const;
  const all = receipts();

  return (
    <div>
      <h1 className="text-lg font-semibold">Ops</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        Health of the machinery. Dev mode: queue, spam and pool metrics activate with the wrapper webhooks.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Ledger entries" value={all.length} />
        <StatTile label="Queue depth" value={0} detail="pure FIFO" />
        <StatTile label="Auto-closes (24h)" value={0} detail="spam pre-gate" />
        <StatTile label="Banlist" value={0} detail="credibility < 0.1" />
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

      <SectionTitle>Pool</SectionTitle>
      <Table head={["component", "status", "note"]}>
        <tr>
          <Td>worker pool</Td>
          <Td><Badge kind="neutral">dev / mock</Badge></Td>
          <Td>health-gate activates with the production pool — degraded pool pauses the queue, never scores</Td>
        </tr>
        <tr>
          <Td>attestation</Td>
          <Td><Badge kind="neutral">local-trusted</Badge></Td>
          <Td>TDX quotes land with the Polaris integration; receipts state their trust mode either way</Td>
        </tr>
      </Table>
    </div>
  );
}
