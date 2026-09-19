"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { AnimalCreate, AnimalOut, AnimalUpdate } from "@/lib/types";
import { Card, btn } from "@/components/ui";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const blank = (v: string) => (v.trim() === "" ? null : v.trim());

const createSchema = z.object({
  tag_id: z.string().trim().min(1, "Tag ID is required"),
  ranch_id: z.string().min(1, "Choose a ranch"),
  dob: z.string().nullable(),
  color: z.string().nullable(),
  gender: z.string().nullable(),
  sire_id: z.string().nullable(),
  dam_id: z.string().nullable(),
  registry_number: z.string().nullable(),
  breed_association: z.string().nullable(),
});

const updateSchema = z.object({
  color: z.string().nullable(),
  gender: z.string().nullable(),
  status: z.enum(["active", "sold", "deceased"]),
  cause_of_death: z.string().nullable(),
  registry_number: z.string().nullable(),
});

function Row({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

type Props = {
  mode: "create" | "edit";
  animal?: AnimalOut;
  ranches: { id: string; name: string }[];
  parents?: AnimalOut[];
};

export function AnimalForm({ mode, animal, ranches, parents = [] }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<{ method: string; path: string; body: AnimalCreate | AnimalUpdate } | null>(null);
  const [status, setStatus] = useState(animal?.status ?? "active");
  const sires = parents.filter((p) => p.gender === "bull");
  const dams = parents.filter((p) => p.gender === "cow");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const result =
      mode === "create"
        ? createSchema.safeParse({
            tag_id: get("tag_id"),
            ranch_id: get("ranch_id"),
            dob: blank(get("dob")),
            color: blank(get("color")),
            gender: blank(get("gender")),
            sire_id: blank(get("sire_id")),
            dam_id: blank(get("dam_id")),
            registry_number: blank(get("registry_number")),
            breed_association: blank(get("breed_association")),
          })
        : updateSchema.safeParse({
            color: blank(get("color")),
            gender: blank(get("gender")),
            status: get("status"),
            cause_of_death: blank(get("cause_of_death")),
            registry_number: blank(get("registry_number")),
          });

    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      setSaved(null);
      return;
    }
    setErrors({});
    // TODO(backend): replace with fetch(POST /animals) or fetch(PATCH /animals/{id}).
    setSaved(
      mode === "create"
        ? { method: "POST", path: "/animals", body: result.data as AnimalCreate }
        : { method: "PATCH", path: `/animals/${animal!.id}`, body: result.data as AnimalUpdate },
    );
  }

  const d = animal;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
      <Card className="space-y-4 p-4 sm:p-6">
        {mode === "create" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Tag ID *" error={errors.tag_id}>
                <input name="tag_id" className={clsx(INPUT, "font-mono")} placeholder="RS-142" autoCapitalize="characters" />
              </Row>
              <Row label="Ranch *" error={errors.ranch_id}>
                <select name="ranch_id" className={INPUT} defaultValue={ranches[0]?.id}>
                  {ranches.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Date of birth">
                <input name="dob" type="date" className={INPUT} />
              </Row>
              <Row label="Gender">
                <select name="gender" className={INPUT} defaultValue="">
                  <option value="">Unknown</option>
                  {["cow", "heifer", "steer", "bull"].map((g) => (
                    <option key={g} value={g}>
                      {g[0].toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Sire">
                <select name="sire_id" className={INPUT} defaultValue="">
                  <option value="">Unknown</option>
                  {sires.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tag_id}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Dam">
                <select name="dam_id" className={INPUT} defaultValue="">
                  <option value="">Unknown</option>
                  {dams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tag_id}
                    </option>
                  ))}
                </select>
              </Row>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Color">
                <input name="color" className={INPUT} placeholder="Black" />
              </Row>
              <Row label="Registry number">
                <input name="registry_number" className={INPUT} placeholder="AAA1234567" />
              </Row>
            </div>
            <Row label="Breed association">
              <input name="breed_association" className={INPUT} placeholder="American Angus Association" />
            </Row>
          </>
        ) : (
          <>
            <p className="rounded-xl bg-surface2 px-3 py-2 text-xs text-muted">
              Only color, gender, status, cause of death and registry number can be changed after registration.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Status" error={errors.status}>
                <select name="status" className={INPUT} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                </select>
              </Row>
              <Row label="Cause of death" hint={status === "deceased" ? undefined : "Only applies when deceased"}>
                <input name="cause_of_death" className={INPUT} defaultValue={d?.cause_of_death ?? ""} disabled={status !== "deceased"} />
              </Row>
              <Row label="Color">
                <input name="color" className={INPUT} defaultValue={d?.color ?? ""} />
              </Row>
              <Row label="Gender">
                <select name="gender" className={INPUT} defaultValue={d?.gender ?? ""}>
                  <option value="">Unknown</option>
                  {["cow", "heifer", "steer", "bull"].map((g) => (
                    <option key={g} value={g}>
                      {g[0].toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </Row>
            </div>
            <Row label="Registry number">
              <input name="registry_number" className={INPUT} defaultValue={d?.registry_number ?? ""} />
            </Row>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Link href={animal ? `/animals/${animal.id}` : "/animals"} className={btn.ghost}>
            Cancel
          </Link>
          <button type="submit" className={btn.primary}>
            {mode === "create" ? "Register animal" : "Save changes"}
          </button>
        </div>
      </Card>

      <div className="lg:sticky lg:top-24">
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-ok/40 p-4 sm:p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-ok">
                  <FontAwesomeIcon icon={faCheck} /> Validated
                </p>
                <p className="mt-1 text-xs text-muted">
                  Backend isn&apos;t connected yet, so nothing was saved. This is the request that would be sent:
                </p>
                <pre className="scroll-x mt-3 rounded-xl bg-surface2 p-3 text-[11px] leading-5">
                  <b>
                    {saved.method} {saved.path}
                  </b>
                  {"\n"}
                  {JSON.stringify(saved.body, null, 2)}
                </pre>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-4 text-xs text-muted sm:p-5">
                <p className="font-medium text-fg">{mode === "create" ? "POST /animals" : "PATCH /animals/{id}"}</p>
                <p className="mt-1">Fields follow the animal-service schema. RFID and other identifiers are attached after registration.</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
