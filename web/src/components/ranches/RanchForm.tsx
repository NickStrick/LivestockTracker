"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { closeRing } from "@/lib/geo";
import type { RanchCreate } from "@/lib/types";
import { Card } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { RequestPreview } from "@/components/RequestPreview";
import { BoundaryPicker } from "./BoundaryPicker";
import { useI18n } from "@/lib/i18n/client";

const INPUT = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const schema = z.object({
  name: z.string().trim().min(1, "Give the ranch a name"),
  customer_id: z.string().min(1),
  boundary: z.array(z.array(z.number()).length(2)).min(4, "Draw at least 3 corners on the map"),
});

export function RanchForm({ customerId }: { customerId: string }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [points, setPoints] = useState<number[][]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<RanchCreate | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ name, customer_id: customerId, boundary: closeRing(points) });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const i of result.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      setSaved(null);
      return;
    }
    setErrors({});
    // TODO(backend): fetch(POST /ranches)
    setSaved(result.data);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
      <Card className="space-y-5 p-4 sm:p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{t("Ranch name *")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder={t("Rio Seco Ranch")} />
          {errors.name && <span className="mt-1 block text-xs text-danger">{t(errors.name)}</span>}
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">{t("Perimeter *")}</span>
          <BoundaryPicker value={points} onChange={setPoints} error={errors.boundary} />
        </div>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Link href="/ranches" className={btn.ghost}>{t("Cancel")}
          </Link>
          <button type="submit" className={btn.primary}>{t("Onboard ranch")}
          </button>
        </div>
      </Card>
      <div className="lg:sticky lg:top-24">
        {saved ? (
          <RequestPreview method="POST" path="/ranches" body={saved} doneHref="/ranches" doneLabel="Back to ranches" />
        ) : (
          <Card className="p-4 text-xs text-muted sm:p-5">
            <p className="font-medium text-fg">{t("POST /ranches")}</p>
            <p className="mt-1">{t("The perimeter is sent as a closed ring of [lon, lat] pairs. Zones are added after the ranch exists.")}</p>
          </Card>
        )}
      </div>
    </form>
  );
}
