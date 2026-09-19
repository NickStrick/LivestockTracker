"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { closeRing, pointInRing } from "@/lib/geo";
import { titleCase } from "@/lib/format";
import { ZONE_TYPES, type Ring, type ZoneCreate, type ZoneOut, type ZoneType } from "@/lib/types";
import { Card, btn } from "@/components/ui";
import { RequestPreview } from "@/components/RequestPreview";
import { BoundaryPicker } from "./BoundaryPicker";
import { ZONE_COLORS } from "./zones";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const schema = z.object({
  name: z.string().trim().min(1, "Give the zone a name"),
  zone_type: z.enum(ZONE_TYPES),
  description: z.string().nullable(),
  boundary: z.array(z.array(z.number()).length(2)).min(4, "Draw at least 3 corners on the map"),
});

export function ZoneForm({ ranchId, ranchName, ranchBoundary, existing }: { ranchId: string; ranchName: string; ranchBoundary: Ring; existing: ZoneOut[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ZoneType>("pasture");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState<number[][]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<ZoneCreate | null>(null);

  const reference = useMemo(
    () => [
      { ring: ranchBoundary, color: "#ffffff", dashed: true },
      ...existing.map((z) => ({ ring: z.boundary, color: ZONE_COLORS[z.zone_type], fill: true })),
    ],
    [ranchBoundary, existing],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const boundary = closeRing(points);
    const result = schema.safeParse({ name, zone_type: type, description: description.trim() || null, boundary });
    const next: Record<string, string> = {};
    if (!result.success) for (const i of result.error.issues) next[String(i.path[0])] ??= i.message;
    else if (points.some(([lon, lat]) => !pointInRing(lon, lat, ranchBoundary))) next.boundary = `Every corner must be inside ${ranchName}'s perimeter (white dashed line).`;
    if (Object.keys(next).length || !result.success) {
      setErrors(next);
      setSaved(null);
      return;
    }
    setErrors({});
    // TODO(backend): fetch(POST /ranches/{id}/zones)
    setSaved(result.data);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
      <Card className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Zone name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="South Pasture" />
            {errors.name && <span className="mt-1 block text-xs text-danger">{errors.name}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Type *</span>
            <select value={type} onChange={(e) => setType(e.target.value as ZoneType)} className={INPUT}>
              {ZONE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} placeholder="Optional notes" />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Boundary *</span>
          <BoundaryPicker value={points} onChange={setPoints} reference={reference} color={ZONE_COLORS[type]} error={errors.boundary} />
        </div>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Link href={`/ranches/${ranchId}`} className={btn.ghost}>
            Cancel
          </Link>
          <button type="submit" className={btn.primary}>
            Create zone
          </button>
        </div>
      </Card>
      <div className="lg:sticky lg:top-24">
        {saved ? (
          <RequestPreview method="POST" path={`/ranches/${ranchId}/zones`} body={saved} doneHref={`/ranches/${ranchId}`} doneLabel={`Back to ${ranchName}`} />
        ) : (
          <Card className="p-4 text-xs text-muted sm:p-5">
            <p className="font-medium text-fg">POST /ranches/{"{id}"}/zones</p>
            <p className="mt-1">Zone corners are checked against the ranch perimeter here as a convenience; the API is the source of truth.</p>
          </Card>
        )}
      </div>
    </form>
  );
}
