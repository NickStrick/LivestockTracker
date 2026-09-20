"use client";

import { useState } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import type { EndpointView, FieldView, Status } from "@/lib/devspec/types";

const METHOD_TONE: Record<EndpointView["method"], string> = {
  GET: "bg-info/15 text-info",
  POST: "bg-ok/15 text-ok",
  PATCH: "bg-warn/15 text-warn",
  PUT: "bg-warn/15 text-warn",
  DELETE: "bg-danger/15 text-danger",
};

export function MethodBadge({ method }: { method: EndpointView["method"] }) {
  return <span className={clsx("inline-flex h-6 min-w-14 shrink-0 items-center justify-center rounded-md px-2 font-mono text-[11px] font-bold", METHOD_TONE[method])}>{method}</span>;
}

const STATUS_STYLE: Record<Status, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-primary/15 text-primary" },
  changed: { label: "Changed", cls: "bg-warn/15 text-warn" },
  exists: { label: "Exists", cls: "bg-surface2 text-muted" },
};

export function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return <span className={clsx("inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold", s.cls)}>{s.label}</span>;
}

export function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" }) {
  return <span className={clsx("inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-medium", tone === "danger" ? "border-danger/40 text-danger" : "border-line text-muted")}>{children}</span>;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-[11px] font-medium text-muted transition hover:text-fg"
    >
      <FontAwesomeIcon icon={done ? faCheck : faCopy} className={done ? "text-ok" : ""} /> {done ? "Copied" : label}
    </button>
  );
}

/** A labelled, copyable block of JSON or text. */
export function Code({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
        <CopyButton text={text} />
      </div>
      <pre className="max-h-72 overflow-auto rounded-xl border border-line bg-surface2 p-3 font-mono text-xs leading-relaxed">{text}</pre>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  );
}

export function TypeText({ f, onRef }: { f: Pick<FieldView, "type" | "ref" | "nullable">; onRef: (name: string) => void }) {
  const base = f.ref ? f.type.replace(f.ref, "") : "";
  return (
    <span className="font-mono text-xs">
      {f.ref ? (
        <>
          <button type="button" onClick={() => onRef(f.ref!)} className="text-primary underline-offset-2 hover:underline">
            {f.ref}
          </button>
          {base}
        </>
      ) : (
        f.type
      )}
      {f.nullable && <span className="text-muted"> | null</span>}
    </span>
  );
}

export function SchemaLink({ name, onRef }: { name: string; onRef: (name: string) => void }) {
  return (
    <button type="button" onClick={() => onRef(name)} className="font-mono text-xs text-primary underline-offset-2 hover:underline">
      {name}
    </button>
  );
}
