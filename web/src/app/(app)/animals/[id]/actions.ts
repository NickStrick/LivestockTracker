"use server";

import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { recordCostEstimate, recordObservation, recordVaccination, recordWeight, updateLineage, type RecordResult } from "@/lib/api";
import { estimateSchema, fieldErrors, lineageSchema, observationSchema, vaccinationSchema, weightSchema } from "@/lib/recordSchemas";

/**
 * Server actions behind the "Record" menu on the animal page. Input is re-validated here (never trust
 * the browser); on success the whole app is revalidated so lists, charts, alerts and the timeline update.
 */
export type ActionResult = { ok: true } | { ok: false; error?: string; fields?: Record<string, string> };

async function run<T>(schema: ZodType<T>, input: unknown, save: (v: T) => Promise<RecordResult>): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  const res = await save(parsed.data);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addObservation(animalId: string, input: unknown) {
  return run(observationSchema, input, (v) => recordObservation(animalId, v));
}
export async function addVaccination(animalId: string, input: unknown) {
  return run(vaccinationSchema, input, (v) => recordVaccination(animalId, v));
}
export async function addWeight(animalId: string, input: unknown) {
  return run(weightSchema, input, (v) => recordWeight(animalId, v));
}
export async function addCostEstimate(animalId: string, input: unknown) {
  return run(estimateSchema, input, (v) => recordCostEstimate(animalId, v));
}
export async function saveLineage(animalId: string, input: unknown) {
  return run(lineageSchema, input, (v) => updateLineage(animalId, v));
}
