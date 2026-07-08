"use client";
// Searchable + chip-filterable table. Server components pre-render each row's
// cells (ReactNode) and hand over a lowercase `search` blob + optional `tags`;
// this component owns only the interaction. Keeps the truth on the server while
// giving miners the find-my-row affordance every table on the site needs.
import { useMemo, useState, type ReactNode } from "react";

export type FilterRow = { id: string; search: string; tags?: string[]; cells: ReactNode[] };

export function FilterTable({
  head, rows, filters, placeholder = "search…", empty = "nothing here yet",
}: {
  head: string[];
  rows: FilterRow[];
  filters?: { key: string; label: string }[];
  placeholder?: string;
  empty?: string;
}) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!q || r.search.toLowerCase().includes(q.toLowerCase())) &&
          (!tag || (r.tags ?? []).includes(tag)),
      ),
    [rows, q, tag],
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="num rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ border: "1px solid var(--grid)", background: "var(--surface)", color: "var(--ink)", minWidth: 180 }}
          aria-label="search table"
        />
        {filters && filters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={tag === null} onClick={() => setTag(null)}>all</Chip>
            {filters.map((f) => (
              <Chip key={f.key} active={tag === f.key} onClick={() => setTag(f.key)}>{f.label}</Chip>
            ))}
          </div>
        )}
        <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>
          {shown.length}{shown.length !== rows.length ? ` of ${rows.length}` : ""}
        </span>
      </div>
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
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                {r.cells.map((c, i) => (
                  <td key={i} className="px-4 py-2.5 align-top" style={{ borderBottom: "1px solid var(--grid)", color: "var(--ink-2)" }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={head.length} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
                  {q || tag ? "no rows match your filter" : empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2.5 py-1 text-xs transition-colors"
      style={{
        border: `1px solid ${active ? "var(--accent)" : "var(--grid)"}`,
        background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
        color: active ? "var(--accent-ink)" : "var(--ink-2)",
      }}
    >
      {children}
    </button>
  );
}
