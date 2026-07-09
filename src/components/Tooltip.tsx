"use client";
// Hover/focus tooltip primitive. Two forms: <Info> is a small "i" affordance
// that sits next to a label; <Tooltip> wraps arbitrary children. Keyboard- and
// screen-reader-reachable (focusable, aria-label). Theme-aware via CSS vars.
import { useState, type ReactNode } from "react";

function Bubble({ text, show }: { text: string; show: boolean }) {
  if (!show) return null;
  return (
    <span
      role="tooltip"
      className="card absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 px-3 py-2 text-left text-xs font-normal normal-case leading-snug shadow-md"
      style={{ color: "var(--ink-2)", letterSpacing: "normal" }}
    >
      {text}
    </span>
  );
}

export function Info({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      aria-label={text}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 cursor-pointer" style={{ color: "var(--muted)" }}>
        <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="8" cy="4.9" r="1" fill="currentColor" />
        <rect x="7.2" y="7" width="1.6" height="5" rx="0.8" fill="currentColor" />
      </svg>
      <Bubble text={text} show={show} />
    </span>
  );
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex cursor-default border-b border-dotted"
      style={{ borderColor: "var(--muted)" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      aria-label={text}
    >
      {children}
      <Bubble text={text} show={show} />
    </span>
  );
}
