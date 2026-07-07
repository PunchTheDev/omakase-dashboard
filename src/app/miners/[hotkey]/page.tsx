// Miner profile — their submissions, verdicts, and labels, straight from the logs.
import { notFound } from "next/navigation";
import { Badge, ReceiptLink, SectionTitle, Table, Td } from "@/components/ui";
import { champions, fmtTs, receipts } from "@/lib/data";

export default async function MinerPage({ params }: { params: Promise<{ hotkey: string }> }) {
  const { hotkey } = await params;
  const key = decodeURIComponent(hotkey);
  const rows = receipts().filter((r) => (r.entry.payload.hotkey as string) === key);
  if (!rows.length) notFound();
  const held = champions().filter((c) => c.holder === key);

  return (
    <div>
      <h1 className="num text-lg font-semibold">{key}</h1>
      <div className="mt-2 flex gap-2">
        {held.length
          ? held.map((c) => <Badge key={c.competition} kind="accent">{c.label} · {c.competition}</Badge>)
          : <Badge kind="neutral">no labels currently held</Badge>}
      </div>
      <SectionTitle>Activity</SectionTitle>
      <Table head={["when", "competition", "event", "receipt"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td num>{fmtTs(r.entry.ts)}</Td>
            <Td>{r.repo}</Td>
            <Td>{r.entry.kind}</Td>
            <Td><ReceiptLink id={r.id} /></Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
