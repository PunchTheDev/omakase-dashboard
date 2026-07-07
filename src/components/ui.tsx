import Link from "next/link";
import type { ReactNode } from "react";

export function StatTile({ label, value, detail, accent }: {
  label: string; value: ReactNode; detail?: ReactNode; accent?: boolean;
}) {
  return (
    <div className="card px-5 py-4">
      <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="num mt-1 text-2xl font-semibold" style={accent ? { color: "var(--accent)" } : undefined}>
        {value}
      </div>
      {detail && <div className="mt-1 text-xs" style={{ color: "var(--ink-2)" }}>{detail}</div>}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mt-10 mb-3 flex items-baseline justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-2)" }}>{children}</h2>
      {hint && <span className="text-xs" style={{ color: "var(--muted)" }}>{hint}</span>}
    </div>
  );
}

export function Badge({ kind, children }: { kind: "pass" | "fail" | "neutral" | "accent"; children: ReactNode }) {
  const color = { pass: "var(--good-text)", fail: "var(--critical)", neutral: "var(--muted)", accent: "var(--accent-ink)" }[kind];
  const mark = { pass: "✓", fail: "✕", neutral: "•", accent: "◆" }[kind];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <span aria-hidden>{mark}</span>{children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="card px-5 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
      {children}
    </div>
  );
}

export function ReceiptLink({ id }: { id: string }) {
  return (
    <Link href={`/runs/${id}`} className="num text-xs hover:underline" style={{ color: "var(--accent)" }}>
      {id}
    </Link>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--muted)", borderBottom: "1px solid var(--grid)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, num }: { children: ReactNode; num?: boolean }) {
  return (
    <td className={`px-4 py-2.5 align-top ${num ? "num" : ""}`} style={{ borderBottom: "1px solid var(--grid)", color: "var(--ink-2)" }}>
      {children}
    </td>
  );
}
