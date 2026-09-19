"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui";

/** Shown after a form validates while there's no backend: the request that would be sent. */
export function RequestPreview({ method, path, body, doneHref, doneLabel }: { method: string; path: string; body: unknown; doneHref?: string; doneLabel?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-ok/40 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ok">
          <FontAwesomeIcon icon={faCheck} /> Validated
        </p>
        <p className="mt-1 text-xs text-muted">Backend isn&apos;t connected yet, so nothing was saved. This is the request that would be sent:</p>
        <pre className="scroll-x mt-3 max-h-80 rounded-xl bg-surface2 p-3 text-[11px] leading-5">
          <b>
            {method} {path}
          </b>
          {"\n"}
          {JSON.stringify(body, null, 2)}
        </pre>
        {doneHref && (
          <Link href={doneHref} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            {doneLabel ?? "Done"}
          </Link>
        )}
      </Card>
    </motion.div>
  );
}
