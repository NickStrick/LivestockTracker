/**
 * Deterministic mock dataset. Uses a seeded PRNG and a fixed "now" so server and
 * client render identical data (no hydration mismatches). Replace with real API
 * calls in lib/api.ts -- nothing else should import this file.
 */
import type {
  AnimalOut,
  AuditEventOut,
  BreedingEvent,
  ComplianceDocument,
  MovementRecord,
  GpsPosition,
  HealthObservation,
  IdentifierOut,
  IdType,
  RanchDetail,
  Ring,
  Vaccination,
  WeightRecord,
  ZoneOut,
  ZoneType,
} from "../types";
import { pointInRing } from "../geo";

export const MOCK_NOW = new Date("2026-09-19T15:00:00Z");
const DAY = 86_400_000;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260919);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const iso = (d: Date) => d.toISOString();
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const pad = (n: number, w = 4) => String(n).padStart(w, "0");

// ---------- geometry ----------

interface BBox {
  lon: number;
  lat: number;
  w: number;
  h: number;
}
const toRing = (bbox: BBox, unit: number[][]): Ring => {
  const ring = unit.map(([x, y]) => [
    +(bbox.lon + x * bbox.w).toFixed(6),
    +(bbox.lat + y * bbox.h).toFixed(6),
  ]);
  ring.push(ring[0]);
  return ring;
};

// ---------- ranches & zones ----------

const BOUNDARY_UNIT = [
  [0.02, 0.12],
  [0.36, 0.0],
  [0.82, 0.06],
  [1.0, 0.42],
  [0.92, 0.95],
  [0.46, 1.0],
  [0.05, 0.82],
];

const bbox1: BBox = { lon: -98.93, lat: 30.24, w: 0.11, h: 0.075 };
const bbox2: BBox = { lon: -106.02, lat: 35.5, w: 0.09, h: 0.06 };

export const ranches: RanchDetail[] = [
  {
    id: "rnc_01",
    customer_id: "cus_bartlett",
    name: "Rio Seco Ranch",
    created_at: "2026-01-12T16:20:00Z",
    boundary: toRing(bbox1, BOUNDARY_UNIT),
  },
  {
    id: "rnc_02",
    customer_id: "cus_bartlett",
    name: "High Mesa Ranch",
    created_at: "2026-03-03T14:05:00Z",
    boundary: toRing(bbox2, BOUNDARY_UNIT),
  },
];

type ZoneSeed = [string, ZoneType, string | null, number[][], boolean?];
const zoneSeeds: Record<string, { bbox: BBox; zones: ZoneSeed[] }> = {
  rnc_01: {
    bbox: bbox1,
    zones: [
      ["North Pasture", "pasture", "Improved coastal bermuda, rotational grazing.", [[0.16, 0.6], [0.55, 0.62], [0.6, 0.9], [0.22, 0.86]]],
      ["Creek Water Access", "water", "Seasonal creek, fenced access points.", [[0.6, 0.35], [0.78, 0.3], [0.8, 0.5], [0.62, 0.55]]],
      ["Cedar Break", "forest", "Dense ashe juniper; low visibility.", [[0.62, 0.66], [0.86, 0.62], [0.84, 0.86], [0.66, 0.88]]],
      ["Limestone Bluff", "dangerous_terrain", "Steep drop-offs along the east bluff.", [[0.84, 0.2], [0.96, 0.4], [0.88, 0.5], [0.8, 0.36]]],
      ["Holding Paddock", "paddock", "Handling pens and working chute.", [[0.2, 0.2], [0.36, 0.18], [0.38, 0.34], [0.22, 0.36]]],
      ["Isolation Pen", "quarantine", "Used for new arrivals. Lifted after clearance.", [[0.42, 0.16], [0.54, 0.16], [0.54, 0.28], [0.42, 0.28]], false],
    ],
  },
  rnc_02: {
    bbox: bbox2,
    zones: [
      ["Mesa Top Pasture", "pasture", "Native blue grama, summer range.", [[0.2, 0.5], [0.62, 0.55], [0.6, 0.85], [0.24, 0.8]]],
      ["Windmill Tank", "water", "Solar pump and storage tank.", [[0.66, 0.3], [0.8, 0.28], [0.82, 0.42], [0.68, 0.44]]],
      ["Arroyo Crossing", "dangerous_terrain", "Flash-flood risk in monsoon season.", [[0.3, 0.18], [0.5, 0.14], [0.52, 0.3], [0.32, 0.32]]],
      ["Working Paddock", "paddock", null, [[0.66, 0.6], [0.84, 0.56], [0.86, 0.76], [0.68, 0.8]]],
    ],
  },
};

export const zones: ZoneOut[] = Object.entries(zoneSeeds).flatMap(([ranchId, { bbox, zones: zs }]) =>
  zs.map(([name, zone_type, description, unit, active = true], i) => ({
    id: `zon_${ranchId.slice(-2)}${i + 1}`,
    ranch_id: ranchId,
    name,
    zone_type,
    description,
    boundary: toRing(bbox, unit),
    active,
    created_at: iso(addDays(new Date(ranches.find((r) => r.id === ranchId)!.created_at), 1 + i)),
    lifted_at: active ? null : "2026-08-02T17:10:00Z",
  })),
);

// ---------- animals ----------

const RANCH_CFG: Record<string, { prefix: string; assoc: string[]; onboard: Date; bulls: number; cows: number; bbox: BBox }> = {
  rnc_01: { prefix: "RS", assoc: ["American Angus Association", "American Angus Association", "Red Angus Association of America"], onboard: new Date("2026-01-12T16:20:00Z"), bulls: 4, cows: 13, bbox: bbox1 },
  rnc_02: { prefix: "HM", assoc: ["American Hereford Association", "American Hereford Association", "American Angus Association"], onboard: new Date("2026-03-03T14:05:00Z"), bulls: 3, cows: 10, bbox: bbox2 },
};
const COLORS = ["Black", "Black", "Red", "Black Baldy", "Red Baldy", "White", "Brindle"];
const CAUSES = ["Pneumonia", "Bloat", "Predation", "Calving complications"];

export const animals: AnimalOut[] = [];
const seq: Record<string, number> = {};

function makeAnimal(ranch: string, gender: string, dob: Date, sire: string | null, dam: string | null): AnimalOut {
  const cfg = RANCH_CFG[ranch];
  seq[ranch] = (seq[ranch] ?? 100) + 1;
  const n = animals.length + 1;
  const assoc = pick(cfg.assoc);
  const registered = rand() < 0.65;
  const createdAt = new Date(Math.max(cfg.onboard.getTime() + Math.floor(rand() * 5) * DAY, dob.getTime() + DAY));
  const a: AnimalOut = {
    id: `ani_${pad(n)}`,
    tag_id: `${cfg.prefix}-${seq[ranch]}`,
    dob: dateOnly(dob),
    color: pick(COLORS),
    gender,
    sire_id: sire,
    dam_id: dam,
    ranch_id: ranch,
    status: "active",
    cause_of_death: null,
    registry_number: registered ? `${assoc.startsWith("American Angus") ? "AAA" : assoc.startsWith("American Hereford") ? "AHA" : "RAAA"}${Math.floor(between(1_000_000, 4_999_999))}` : null,
    breed_association: registered ? assoc : null,
    created_at: iso(createdAt),
  };
  animals.push(a);
  return a;
}

for (const ranch of Object.keys(RANCH_CFG)) {
  const cfg = RANCH_CFG[ranch];
  const bulls = Array.from({ length: cfg.bulls }, () => makeAnimal(ranch, "bull", new Date(Date.UTC(2017 + Math.floor(rand() * 4), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))), null, null));
  const cows = Array.from({ length: cfg.cows }, () => makeAnimal(ranch, "cow", new Date(Date.UTC(2018 + Math.floor(rand() * 4), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))), null, null));
  // Calves: 2023-2026 spring calving, from cows that were already mature.
  for (const year of [2024, 2025, 2026]) {
    for (const cow of cows) {
      if (rand() < 0.42) {
        const dob = new Date(Date.UTC(year, 1 + Math.floor(rand() * 3), 1 + Math.floor(rand() * 27)));
        makeAnimal(ranch, pick(["heifer", "steer", "heifer", "bull"]), dob, pick(bulls).id, cow.id);
      }
    }
  }
}

// Status changes: a few sold, a couple deceased (not the sires/dams of many calves, doesn't matter for a mock).
const sold = ["ani_0004", "ani_0022", "ani_0031", "ani_0040", "ani_0047"];
const dead = ["ani_0019", "ani_0043"];
export const statusChanges: { id: string; status: string; cause?: string; at: Date }[] = [];
for (const id of sold) {
  const a = animals.find((x) => x.id === id);
  if (a) {
    a.status = "sold";
    statusChanges.push({ id, status: "sold", at: addDays(MOCK_NOW, -Math.floor(between(12, 90))) });
  }
}
for (const id of dead) {
  const a = animals.find((x) => x.id === id);
  if (a) {
    a.status = "deceased";
    a.cause_of_death = pick(CAUSES);
    statusChanges.push({ id, status: "deceased", cause: a.cause_of_death, at: addDays(MOCK_NOW, -Math.floor(between(20, 120))) });
  }
}

const byId = new Map(animals.map((a) => [a.id, a]));
export const getById = (id: string) => byId.get(id);

// ---------- identifiers ----------

const ISSUERS = ["Allflex", "Datamars", "Ranch tag program", "USDA"];
export const identifiers: IdentifierOut[] = animals.flatMap((a, i) => {
  const out: IdentifierOut[] = [];
  const mk = (type: IdType, value: string, issued_by: string | null, k: number) =>
    out.push({ id: `idn_${pad(i * 3 + k)}`, animal_id: a.id, id_type: type, value, issued_by, issued_at: a.created_at });
  mk("RFID", `982 ${String(Math.floor(between(1e11, 9.99e11)))}`, pick(ISSUERS), 1);
  if (rand() < 0.4) mk("EID", `840 ${String(Math.floor(between(1e11, 9.99e11)))}`, "USDA", 2);
  if (rand() < 0.3) mk("ear_tattoo", `${a.tag_id.replace("-", "")}${(a.dob ?? "2020").slice(2, 4)}`, null, 3);
  return out;
});

// ---------- weights ----------

const MATURE: Record<string, number> = { cow: 1200, bull: 1900, heifer: 1050, steer: 1250 };
const isActive = (a: AnimalOut) => a.status === "active";
export const weights: WeightRecord[] = [];
{
  let n = 0;
  for (const a of animals.filter(isActive)) {
    const dob = new Date(a.dob!);
    for (let m = 5; m >= 0; m--) {
      const at = new Date(Date.UTC(2026, 8 - m, 5 + Math.floor(rand() * 10)));
      if (at > MOCK_NOW) continue;
      const ageMonths = (at.getTime() - dob.getTime()) / (30.4 * DAY);
      if (ageMonths < 0) continue;
      const mature = MATURE[a.gender ?? "cow"] ?? 1100;
      const w = (75 + (mature - 75) * (1 - Math.exp(-ageMonths / 11))) * between(0.96, 1.04);
      weights.push({ id: `wgt_${pad(++n, 5)}`, animal_id: a.id, weighed_at: iso(at), weight_lb: Math.round(w) });
    }
  }
}

// ---------- vaccinations ----------

const VACCINES: [string, number, number][] = [
  ["7-way Clostridial", 2, 365],
  ["BVD/IBR/PI3/BRSV", 2, 365],
  ["Blackleg", 2, 180],
  ["Brucellosis (RB51)", 2, 3650],
  ["Leptospirosis", 2, 365],
];
const VETS = ["Dr. Ortiz", "Dr. Lindqvist", "Ranch hand (M. Gomez)"];
export const vaccinations: Vaccination[] = [];
{
  let n = 0;
  const overdueIds = new Set(["ani_0007", "ani_0012", "ani_0016", "ani_0023", "ani_0026", "ani_0033", "ani_0038", "ani_0041"]);
  const soonIds = new Set(["ani_0002", "ani_0009", "ani_0014", "ani_0021", "ani_0035", "ani_0044"]);
  for (const a of animals.filter(isActive)) {
    const count = 1 + Math.floor(rand() * 2);
    for (let k = 0; k < count; k++) {
      const [vaccine, dose, interval] = VACCINES[(n + k) % VACCINES.length];
      let due: Date;
      if (k === 0 && overdueIds.has(a.id)) due = addDays(MOCK_NOW, -Math.floor(between(5, 60)));
      else if (k === 0 && soonIds.has(a.id)) due = addDays(MOCK_NOW, Math.floor(between(2, 28)));
      else due = addDays(MOCK_NOW, Math.floor(between(45, 300)));
      let adminAt = addDays(due, -Math.min(interval, 3650));
      const createdAt = new Date(a.created_at);
      if (adminAt < createdAt) adminAt = addDays(createdAt, 1 + Math.floor(rand() * 20));
      if (adminAt > MOCK_NOW || adminAt > due) continue;
      vaccinations.push({
        id: `vac_${pad(++n)}`,
        animal_id: a.id,
        vaccine,
        dose_ml: dose,
        administered_at: iso(adminAt),
        administered_by: pick(VETS),
        next_due_at: iso(due),
      });
    }
  }
}

// ---------- health observations & breeding ----------

const SYMPTOMS: [string, "low" | "medium" | "high"][] = [
  ["Slight limp, front left hoof. Trimmed and monitored.", "low"],
  ["Nasal discharge and reduced appetite. Temp 103.9F.", "medium"],
  ["Pinkeye in right eye, treated with oxytetracycline.", "medium"],
  ["Coughing, elevated respiration. Isolated for observation.", "high"],
  ["Bloated left flank after pasture rotation.", "high"],
  ["Minor laceration on rear leg from fencing.", "low"],
];
const ROUTINE = ["Routine check: body condition score 5/9, no concerns.", "Pre-breeding exam: reproductive tract normal.", "Routine check: hooves and teeth good.", "Weaning check: gaining well."];
export const observations: HealthObservation[] = [];
{
  let n = 0;
  const act = animals.filter(isActive);
  for (let i = 0; i < 34; i++) {
    const a = act[Math.floor(rand() * act.length)];
    const symptom = rand() < 0.45;
    const [notes, severity] = symptom ? pick(SYMPTOMS) : [pick(ROUTINE), "low" as const];
    const at = addDays(MOCK_NOW, -Math.floor(between(0, 110)));
    if (at < new Date(a.created_at)) continue;
    observations.push({ id: `obs_${pad(++n)}`, animal_id: a.id, observed_at: iso(at), kind: symptom ? "symptom" : "routine_check", severity, notes });
  }
}
export const breeding: BreedingEvent[] = [];
{
  let n = 0;
  for (const a of animals) {
    if (a.dam_id && a.dob) {
      breeding.push({ id: `brd_${pad(++n)}`, animal_id: a.dam_id, event: "calving", occurred_at: iso(new Date(a.dob + "T10:00:00Z")), sire_id: a.sire_id, notes: `Calf ${a.tag_id} born unassisted.` });
    }
  }
  for (const a of animals.filter((x) => x.gender === "cow" && isActive(x))) {
    if (rand() < 0.55) {
      const heat = addDays(MOCK_NOW, -Math.floor(between(30, 100)));
      breeding.push({ id: `brd_${pad(++n)}`, animal_id: a.id, event: "heat", occurred_at: iso(heat), sire_id: null, notes: null });
      breeding.push({ id: `brd_${pad(++n)}`, animal_id: a.id, event: "insemination", occurred_at: iso(addDays(heat, 1)), sire_id: pick(animals.filter((x) => x.gender === "bull" && x.ranch_id === a.ranch_id)).id, notes: "AI, single straw." });
    }
  }
}

// ---------- GPS positions ----------

const BREACHERS = new Set(["ani_0008", "ani_0027", "ani_0036"]);
export const positions: GpsPosition[] = animals.filter(isActive).map((a) => {
  const ranch = ranches.find((r) => r.id === a.ranch_id)!;
  const { bbox } = RANCH_CFG[a.ranch_id];
  let lon = 0;
  let lat = 0;
  let inside = true;
  if (BREACHERS.has(a.id)) {
    lon = bbox.lon + bbox.w * between(1.02, 1.08);
    lat = bbox.lat + bbox.h * between(0.3, 0.7);
    inside = false;
  } else {
    do {
      lon = bbox.lon + rand() * bbox.w;
      lat = bbox.lat + rand() * bbox.h;
    } while (!pointInRing(lon, lat, ranch.boundary));
  }
  return { animal_id: a.id, ranch_id: a.ranch_id, lon: +lon.toFixed(6), lat: +lat.toFixed(6), recorded_at: iso(addDays(MOCK_NOW, -rand() * 0.05)), inside_boundary: inside };
});

// ---------- compliance (PROVISIONAL schemas) ----------

const RANCH_STATE: Record<string, string> = { rnc_01: "TX", rnc_02: "NM" };
const RANCH_TOWN: Record<string, string> = { rnc_01: "Rio Seco Ranch, Fredericksburg TX", rnc_02: "High Mesa Ranch, Santa Fe NM" };

export const movements: MovementRecord[] = [];
export const documents: ComplianceDocument[] = [];
{
  let m = 0;
  let d = 0;
  const soldChange = (id: string) => statusChanges.find((c) => c.id === id)?.at ?? addDays(MOCK_NOW, -30);
  const addDoc = (doc: Omit<ComplianceDocument, "id" | "file_name" | "size_kb">, ext = "pdf") => {
    const id = `doc_${pad(++d)}`;
    documents.push({ ...doc, id, file_name: `${doc.doc_type}-${pad(d)}.${ext}`, size_kb: Math.floor(between(120, 2400)) });
    return id;
  };
  const addMove = (
    animalIds: string[],
    o: Pick<MovementRecord, "kind" | "direction" | "purpose" | "destination" | "status"> & { at: Date; carrier?: string; notes?: string; cvi?: boolean; brand?: boolean; cviAgeDays?: number; origin?: string },
  ) => {
    const ranch = byId.get(animalIds[0])!.ranch_id;
    const id = `mov_${pad(++m)}`;
    const docIds: string[] = [];
    if (o.cvi) {
      const issued = addDays(o.at, -(o.cviAgeDays ?? 2));
      docIds.push(
        addDoc({ doc_type: "cvi", title: `CVI ${RANCH_STATE[ranch]}-${pad(1000 + m)}`, ranch_id: ranch, animal_ids: animalIds, movement_id: id, issued_at: iso(issued), expires_at: iso(addDays(issued, 30)), issued_by: pick(VETS.slice(0, 2)) }),
      );
    }
    if (o.brand) {
      docIds.push(addDoc({ doc_type: "brand_inspection", title: `Brand inspection ${pad(2000 + m)}`, ranch_id: ranch, animal_ids: animalIds, movement_id: id, issued_at: iso(addDays(o.at, -1)), expires_at: null, issued_by: "State brand inspector" }));
    }
    movements.push({
      id,
      ranch_id: ranch,
      animal_ids: animalIds,
      kind: o.kind,
      direction: o.direction,
      purpose: o.purpose,
      origin: o.origin ?? RANCH_TOWN[ranch],
      destination: o.destination,
      moved_at: iso(o.at),
      status: o.status,
      carrier: o.carrier ?? null,
      notes: o.notes ?? null,
      document_ids: docIds,
    });
  };

  // Sales: every sold animal left on a truck. Group per ranch; the first load stays in-state.
  const soldByRanch = new Map<string, AnimalOut[]>();
  for (const a of animals.filter((x) => x.status === "sold")) soldByRanch.set(a.ranch_id, [...(soldByRanch.get(a.ranch_id) ?? []), a]);
  for (const [ranch, list] of soldByRanch) {
    const first = list.slice(0, 2);
    const rest = list.slice(2);
    addMove(first.map((a) => a.id), { kind: "intrastate", direction: "out", purpose: "sale", destination: ranch === "rnc_01" ? "Kerrville Livestock Auction, TX" : "Santa Fe Livestock Market, NM", status: "completed", at: soldChange(first[0].id), carrier: "Lone Star Cattle Hauling", brand: true });
    if (rest.length) addMove(rest.map((a) => a.id), { kind: "interstate", direction: "out", purpose: "sale", destination: ranch === "rnc_01" ? "Oklahoma National Stockyards, OK" : "Producers Livestock, Greeley CO", status: "completed", at: soldChange(rest[0].id), carrier: "High Plains Transport", cvi: true });
  }

  const r1 = animals.filter((a) => a.ranch_id === "rnc_01" && a.status === "active");
  const r2 = animals.filter((a) => a.ranch_id === "rnc_02" && a.status === "active");
  addMove([r1[2].id, r1[6].id], { kind: "intrastate", direction: "out", purpose: "show", destination: "Kerr County Livestock Show, TX", status: "completed", at: addDays(MOCK_NOW, -25), carrier: "Owner", brand: true });
  addMove([r1[8].id, r1[9].id, r1[10].id], { kind: "interstate", direction: "out", purpose: "grazing", destination: "Lease pasture, Taos NM", status: "completed", at: addDays(MOCK_NOW, -62), carrier: "Rio Grande Livestock", cvi: true, cviAgeDays: 3 });
  addMove([r2[3].id, r2[4].id], { kind: "interstate", direction: "in", purpose: "purchase", origin: "Sunrise Angus, Pueblo CO", destination: RANCH_TOWN.rnc_02, status: "completed", at: new Date("2026-03-10T15:00:00Z"), carrier: "High Plains Transport", cvi: true, cviAgeDays: 4 });
  addMove([r2[7].id], { kind: "intrastate", direction: "out", purpose: "veterinary", destination: "Santa Fe Large Animal Clinic, NM", status: "pending", at: addDays(MOCK_NOW, 3), carrier: "Owner", notes: "Lameness workup, return same day." });
  // Upcoming interstate sale whose CVI runs out 4 days before the truck date.
  addMove([r1[11].id, r1[12].id], { kind: "interstate", direction: "out", purpose: "sale", destination: "Amarillo Livestock Auction, TX to KS feedlot", status: "pending", at: addDays(MOCK_NOW, 12), carrier: "Lone Star Cattle Hauling", cvi: true, cviAgeDays: 34 });
  // Interstate move logged without a CVI -> flagged.
  addMove([r1[13].id], { kind: "interstate", direction: "out", purpose: "sale", destination: "Sale barn, Shreveport LA", status: "flagged", at: addDays(MOCK_NOW, -12), carrier: "Unknown", notes: "CVI not attached. Follow up with the vet." });

  // Per-animal documents: registry papers for registered animals, brucellosis test results.
  for (const a of animals.filter((x) => x.registry_number && x.status === "active").slice(0, 10)) {
    addDoc({ doc_type: "registry_papers", title: `${a.breed_association?.split(" ").slice(0, 2).join(" ")} registration ${a.registry_number}`, ranch_id: a.ranch_id, animal_ids: [a.id], movement_id: null, issued_at: a.created_at, expires_at: null, issued_by: a.breed_association ?? "Breed association" });
  }
  const tests: [AnimalOut, number][] = [
    [r1[0], -335], // expires in ~30d
    [r1[4], -350], // expires in ~15d
    [r2[0], -378], // expired ~13d ago
    [r2[1], -120],
    [r1[5], -200],
  ];
  for (const [a, age] of tests) {
    const issued = addDays(MOCK_NOW, age);
    addDoc({ doc_type: "test_results", title: `Brucellosis test, ${a.tag_id}`, ranch_id: a.ranch_id, animal_ids: [a.id], movement_id: null, issued_at: iso(issued), expires_at: iso(addDays(issued, 365)), issued_by: pick(VETS.slice(0, 2)) });
  }
  // A herd-level health certificate for the ranch that is about to expire.
  addDoc({ doc_type: "health_certificate", title: "Herd health certificate 2026", ranch_id: "rnc_01", animal_ids: r1.slice(0, 12).map((a) => a.id), movement_id: null, issued_at: iso(addDays(MOCK_NOW, -160)), expires_at: iso(addDays(MOCK_NOW, 20)), issued_by: "Dr. Ortiz" });
  movements.sort((a, b) => b.moved_at.localeCompare(a.moved_at));
  documents.sort((a, b) => b.issued_at.localeCompare(a.issued_at));
}

// ---------- audit trail ----------

const ACTORS = ["usr_maria.gomez", "usr_dr.ortiz", "usr_j.bartlett"];
export const audit: AuditEventOut[] = [];
{
  let n = 0;
  const push = (e: Omit<AuditEventOut, "id">) => audit.push({ id: `aud_${pad(++n, 5)}`, ...e });

  for (const r of ranches) {
    push({ animal_id: null, ranch_id: r.id, event_type: "ranch_created", event_data: { name: r.name }, actor_id: "usr_j.bartlett", occurred_at: r.created_at });
  }
  for (const z of zones) {
    push({ animal_id: null, ranch_id: z.ranch_id, event_type: "zone_created", event_data: { name: z.name, zone_type: z.zone_type }, actor_id: "usr_j.bartlett", occurred_at: z.created_at });
    if (z.lifted_at) push({ animal_id: null, ranch_id: z.ranch_id, event_type: "zone_updated", event_data: { name: z.name, active: false }, actor_id: "usr_maria.gomez", occurred_at: z.lifted_at });
  }
  for (const a of animals) {
    push({ animal_id: a.id, ranch_id: a.ranch_id, event_type: "animal_created", event_data: { tag_id: a.tag_id, gender: a.gender }, actor_id: pick(ACTORS.slice(0, 2)), occurred_at: a.created_at });
  }
  for (const i of identifiers) {
    const a = byId.get(i.animal_id)!;
    push({ animal_id: i.animal_id, ranch_id: a.ranch_id, event_type: "identifier_added", event_data: { id_type: i.id_type, value: i.value }, actor_id: "usr_maria.gomez", occurred_at: addDays(new Date(i.issued_at), 0.01).toISOString() });
  }
  for (const v of vaccinations) {
    const a = byId.get(v.animal_id)!;
    push({ animal_id: v.animal_id, ranch_id: a.ranch_id, event_type: "vaccination_recorded", event_data: { vaccine: v.vaccine, dose_ml: v.dose_ml, next_due_at: v.next_due_at.slice(0, 10) }, actor_id: "usr_dr.ortiz", occurred_at: v.administered_at });
  }
  for (const s of statusChanges) {
    const a = byId.get(s.id)!;
    push({ animal_id: s.id, ranch_id: a.ranch_id, event_type: "animal_updated", event_data: { status: s.status, ...(s.cause ? { cause_of_death: s.cause } : {}) }, actor_id: "usr_maria.gomez", occurred_at: iso(s.at) });
  }
  for (const p of positions.filter((x) => !x.inside_boundary)) {
    const a = byId.get(p.animal_id)!;
    push({ animal_id: p.animal_id, ranch_id: p.ranch_id, event_type: "geofence_breach", event_data: { lon: p.lon, lat: p.lat, tag_id: a.tag_id }, actor_id: "system:gps-service", occurred_at: iso(addDays(MOCK_NOW, -Math.floor(between(0, 3)) - 0.1)) });
  }
  for (const mv of movements.filter((x) => x.status !== "pending")) {
    const to = mv.direction === "out" ? mv.destination : mv.origin;
    for (const animalId of mv.animal_ids) {
      push({ animal_id: animalId, ranch_id: mv.ranch_id, event_type: "movement_recorded", event_data: { direction: mv.direction, purpose: mv.purpose, kind: mv.kind, place: to, movement_id: mv.id, cvi: mv.document_ids.length > 0 }, actor_id: "usr_maria.gomez", occurred_at: mv.moved_at });
    }
  }
  for (const doc of documents.filter((x) => x.doc_type !== "registry_papers")) {
    push({ animal_id: doc.animal_ids.length === 1 ? doc.animal_ids[0] : null, ranch_id: doc.ranch_id, event_type: "document_uploaded", event_data: { title: doc.title, doc_type: doc.doc_type, document_id: doc.id }, actor_id: "usr_maria.gomez", occurred_at: doc.issued_at });
  }
  audit.sort((x, y) => y.occurred_at.localeCompare(x.occurred_at));
}
