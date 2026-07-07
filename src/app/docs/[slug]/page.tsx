import Link from "next/link";
import { notFound } from "next/navigation";
import { DOCS, renderDoc } from "@/lib/docs";

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = renderDoc(slug);
  if (!doc) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/docs" className="text-xs underline" style={{ color: "var(--muted)" }}>← all docs</Link>
      <h1 className="mt-2 text-lg font-semibold">{doc.title}</h1>
      <article className="doc-prose mt-4" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </div>
  );
}
