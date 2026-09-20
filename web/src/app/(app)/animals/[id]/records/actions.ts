"use server";

import { revalidatePath } from "next/cache";
import { setAnimalStatus } from "@/lib/api";

/**
 * Marks an animal sold (or undoes it). The API layer validates the transition; on success the whole
 * app is revalidated so counts, alerts, lists and maps all update.
 */
export async function changeAnimalStatus(id: string, status: "sold" | "active") {
  if (typeof id !== "string" || (status !== "sold" && status !== "active")) return { ok: false as const, error: "invalid" as const };
  const result = await setAnimalStatus(id, status);
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidatePath("/", "layout");
  return { ok: true as const };
}
