"use client";
import { useState } from "react";

export function CopyPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-85"
      style={{ background: "var(--accent)", color: "#fff" }}
    >
      {copied ? "Copied — hand it to your agent" : "Mine with your agent · copy bootstrap prompt"}
    </button>
  );
}
