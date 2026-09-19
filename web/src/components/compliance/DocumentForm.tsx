"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { DOC_TYPE_FULL, fmtSize } from "@/lib/format";
import { DOC_TYPES, type AnimalOut, type DocType, type DocumentCreate, type MovementView } from "@/lib/types";
import { Card, btn } from "@/components/ui";
import { RequestPreview } from "@/components/RequestPreview";
import { AnimalPicker } from "./AnimalPicker";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const MAX_KB = 10 * 1024;
const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
/** Types that always carry an expiry date. */
const EXPIRES: DocType[] = ["cvi", "test_results", "health_certificate"];

const schema = z
  .object({
    doc_type: z.enum(DOC_TYPES),
    title: z.string().trim().min(1, "Give the document a title"),
    ranch_id: z.string().min(1),
    animal_ids: z.array(z.string()),
    movement_id: z.string().nullable(),
    issued_at: z.string().min(1, "Enter the issue date"),
    expires_at: z.string().nullable(),
    issued_by: z.string().trim().min(1, "Who issued it?"),
  })
  .refine((v) => !EXPIRES.includes(v.doc_type) || !!v.expires_at, { path: ["expires_at"], message: "This document type needs an expiry date" })
  .refine((v) => !v.expires_at || v.expires_at > v.issued_at, { path: ["expires_at"], message: "Expiry must be after the issue date" })
  .refine((v) => v.doc_type !== "cvi" || v.animal_ids.length > 0, { path: ["animal_ids"], message: "A CVI must list the animals it covers" });

function Row({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function DocumentForm({
  ranches,
  animals,
  movements,
  initialMovement,
  initialAnimal,
}: {
  ranches: { id: string; name: string }[];
  animals: AnimalOut[];
  movements: MovementView[];
  initialMovement?: string;
  initialAnimal?: string;
}) {
  const startMove = movements.find((m) => m.id === initialMovement);
  const startAnimal = animals.find((a) => a.id === initialAnimal);
  const [ranch, setRanch] = useState(startMove?.ranch_id ?? startAnimal?.ranch_id ?? ranches[0]?.id ?? "");
  const [type, setType] = useState<DocType>(startMove ? "cvi" : "test_results");
  const [ids, setIds] = useState<string[]>(startMove?.animal_ids ?? (startAnimal ? [startAnimal.id] : []));
  const [movementId, setMovementId] = useState(startMove?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<DocumentCreate | null>(null);

  const available = useMemo(() => animals.filter((a) => a.ranch_id === ranch), [animals, ranch]);
  const ranchMoves = useMemo(() => movements.filter((m) => m.ranch_id === ranch), [movements, ranch]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const file = f.get("file") as File | null;
    const next: Record<string, string> = {};

    const result = schema.safeParse({
      doc_type: type,
      title: get("title"),
      ranch_id: ranch,
      animal_ids: ids,
      movement_id: movementId || null,
      issued_at: get("issued_at"),
      expires_at: get("expires_at") || null,
      issued_by: get("issued_by"),
    });
    if (!result.success) for (const i of result.error.issues) next[String(i.path[0])] ??= i.message;

    if (!file || file.size === 0) next.file = "Choose a file to upload";
    else if (!ALLOWED.includes(file.type)) next.file = "Only PDF, PNG or JPG files are accepted";
    else if (file.size / 1024 > MAX_KB) next.file = "File is larger than 10 MB";

    if (Object.keys(next).length || !result.success || !file) {
      setErrors(next);
      setSaved(null);
      return;
    }
    setErrors({});
    // TODO(backend): 1) POST /documents (metadata) -> presigned S3 URL, 2) PUT the file to that URL.
    setSaved({ ...result.data, file_name: file.name, size_kb: Math.max(1, Math.round(file.size / 1024)) });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
      <Card className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Document type *">
            <select value={type} onChange={(e) => setType(e.target.value as DocType)} className={INPUT}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_FULL[t]}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Ranch *">
            <select
              value={ranch}
              onChange={(e) => {
                setRanch(e.target.value);
                setIds([]);
                setMovementId("");
              }}
              className={INPUT}
            >
              {ranches.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Row>
        </div>
        <Row label="Title *" error={errors.title}>
          <input name="title" className={INPUT} placeholder={type === "cvi" ? "CVI TX-1042" : "Brucellosis test, RS-104"} />
        </Row>
        <div className="grid gap-4 sm:grid-cols-3">
          <Row label="Issued *" error={errors.issued_at}>
            <input name="issued_at" type="date" className={INPUT} />
          </Row>
          <Row label={EXPIRES.includes(type) ? "Expires *" : "Expires"} error={errors.expires_at} hint={type === "cvi" ? "CVIs are usually valid for 30 days" : undefined}>
            <input name="expires_at" type="date" className={INPUT} />
          </Row>
          <Row label="Issued by *" error={errors.issued_by}>
            <input name="issued_by" className={INPUT} placeholder="Dr. Ortiz" />
          </Row>
        </div>

        <Row label="Linked movement" >
          <select value={movementId} onChange={(e) => setMovementId(e.target.value)} className={INPUT}>
            <option value="">None</option>
            {ranchMoves.map((m) => (
              <option key={m.id} value={m.id}>
                {m.origin.split(",")[0]} → {m.destination.split(",")[0]}
              </option>
            ))}
          </select>
        </Row>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{type === "cvi" ? "Animals covered *" : "Animals covered"}</span>
          <AnimalPicker animals={available} selected={ids} onChange={setIds} error={errors.animal_ids} />
        </div>

        <Row label="File *" error={errors.file} hint="PDF, PNG or JPG, up to 10 MB">
          <input
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="block w-full cursor-pointer rounded-xl border border-dashed border-line bg-surface2/50 p-3 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-fg"
          />
        </Row>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Link href="/compliance?tab=documents" className={btn.ghost}>
            Cancel
          </Link>
          <button type="submit" className={btn.primary}>
            Upload document
          </button>
        </div>
      </Card>

      <div className="lg:sticky lg:top-24">
        {saved ? (
          <div className="space-y-3">
            <RequestPreview method="POST" path="/documents" body={saved} doneHref="/compliance?tab=documents" doneLabel="Back to documents" />
            <Card className="p-4 text-xs text-muted">
              Next, the client would <b className="text-fg">PUT</b> the {fmtSize(saved.size_kb)} file to the presigned S3 URL returned by that call. The file was not sent anywhere.
            </Card>
          </div>
        ) : (
          <Card className="p-4 text-xs text-muted sm:p-5">
            <p className="font-medium text-fg">POST /documents</p>
            <p className="mt-1">Metadata goes to the API; the file itself uploads straight to S3 with a presigned URL. Provisional schema.</p>
          </Card>
        )}
      </div>
    </form>
  );
}
