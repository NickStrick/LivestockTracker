import { z } from "zod";
import { MOCK_NOW } from "./clock";
import { COST_BASES, CURRENCIES } from "./types";

/**
 * Validation for the "Record" forms on the animal page. The SAME schemas run in the browser (instant
 * feedback) and on the server action (the real check). Messages are English translation keys: the
 * forms pass them through t() when showing them. Pure module: safe for React Native too.
 */
export const TODAY = MOCK_NOW.toISOString().slice(0, 10);

const date = (missing: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, missing)
    .refine((d) => d <= TODAY, "The date can't be in the future");

const num = (msg: string) => z.number({ error: msg });

export const observationSchema = z.object({
  observed_at: date("Enter the date of the observation"),
  kind: z.enum(["routine_check", "symptom"]),
  severity: z.enum(["low", "medium", "high"]),
  notes: z.string().trim().min(1, "Describe what you observed").max(500, "Keep the notes under 500 characters"),
});

export const vaccinationSchema = z
  .object({
    vaccine: z.string().trim().min(1, "Choose or enter a vaccine").max(80, "The vaccine name is too long"),
    administered_at: date("Enter the date it was given"),
    dose_ml: num("Enter the dose in mL").min(0.1, "Enter a dose between 0.1 and 50 mL").max(50, "Enter a dose between 0.1 and 50 mL"),
    administered_by: z.string().trim().min(1, "Who gave it?").max(80, "That name is too long"),
    next_due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the next due date"),
  })
  .refine((v) => v.next_due_at >= v.administered_at, { path: ["next_due_at"], message: "The next due date must be after the date given" });

export const weightSchema = z.object({
  weighed_at: date("Enter the date of the weigh-in"),
  weight_lb: num("Enter the weight in pounds").min(20, "Enter a weight between 20 and 4,000 lb").max(4000, "Enter a weight between 20 and 4,000 lb"),
});

export const estimateSchema = z.object({
  estimated_at: date("Enter the date of the estimate"),
  amount: num("Enter the amount").gt(0, "Enter an amount greater than zero").max(10_000_000, "That amount is too large"),
  currency: z.enum(CURRENCIES),
  basis: z.enum(COST_BASES),
  notes: z.string().trim().max(300, "Keep the notes under 300 characters").nullable(),
});

export const lineageSchema = z.object({
  sire_id: z.string().nullable(),
  dam_id: z.string().nullable(),
});

export type ObservationInput = z.infer<typeof observationSchema>;
export type VaccinationInput = z.infer<typeof vaccinationSchema>;
export type WeightInput = z.infer<typeof weightSchema>;
export type EstimateInput = z.infer<typeof estimateSchema>;
export type LineageInput = z.infer<typeof lineageSchema>;

/** First error message per field, for showing under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}
