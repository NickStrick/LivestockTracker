import Link from "next/link";
import clsx from "clsx";
import type { LineageNode } from "@/lib/types";

import { getI18n } from "@/lib/i18n/server";

async function Node({ node, role }: { node: LineageNode | null; role: "Sire" | "Dam" }) {
  const { t, fmtDate, titleCase } = await getI18n();
  const male = role === "Sire";
  return (
    <div className="min-w-0">
      {node ? (
        <Link
          href={`/animals/${node.id}`}
          className={clsx("block rounded-xl border px-3 py-2 transition hover:border-primary", male ? "border-info/30 bg-info/5" : "border-accent/30 bg-accent/5")}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{role}</p>
          <p className="font-mono text-sm font-semibold">{node.tag_id}</p>
          <p className="truncate text-[11px] text-muted">{[node.gender && titleCase(node.gender), fmtDate(node.dob)].filter(Boolean).join(" · ")}</p>
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-line px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{role}</p>
          <p className="text-sm text-muted">{t("Unknown")}</p>
        </div>
      )}
      {node && (node.sire || node.dam) && (
        <div className="ml-3 mt-2 grid gap-2 border-l border-line pl-3 sm:grid-cols-2">
          <Node node={node.sire} role="Sire" />
          <Node node={node.dam} role="Dam" />
        </div>
      )}
    </div>
  );
}

export function LineageTree({ root }: { root: LineageNode }) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <Node node={root.sire} role="Sire" />
      <Node node={root.dam} role="Dam" />
    </div>
  );
}
