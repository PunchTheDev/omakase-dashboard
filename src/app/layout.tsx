import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "omakase — orchestration competitions",
  description:
    "Permissionless competitions for the best open-weights routing model and orchestration harness, on Gittensor (SN74).",
};

const NAV = [
  ["/", "Now"],
  ["/router", "Router"],
  ["/harness", "Harness"],
  ["/benchmarks", "Benchmarks"],
  ["/vs-labs", "vs Labs"],
  ["/miners", "Miners"],
  ["/docs", "Docs"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header style={{ borderBottom: "1px solid var(--grid)", background: "var(--surface)" }}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              omakase<span style={{ color: "var(--accent)" }}>·</span>
              <span className="font-normal" style={{ color: "var(--ink-2)" }}> orchestration competitions</span>
            </Link>
            <nav className="ml-auto flex flex-wrap gap-4 text-sm" style={{ color: "var(--ink-2)" }}>
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="hover:underline">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 pt-8">{children}</main>
        <footer className="py-6 text-center text-xs" style={{ color: "var(--muted)", borderTop: "1px solid var(--grid)" }}>
          <div>every number links to a receipt · frontier logs are hash-chained · Gittensor SN74</div>
          <div className="mt-1 flex justify-center gap-3">
            <a href="https://github.com/PunchTheDev/omakase-router" className="hover:underline">omakase-router</a>
            <a href="https://github.com/PunchTheDev/omakase-harness" className="hover:underline">omakase-harness</a>
            <a href="https://github.com/PunchTheDev/omakase-maintainer" className="hover:underline">Punch</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
