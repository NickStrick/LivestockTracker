import { notFound } from "next/navigation";
import { getAnimal, getAnimalTags, getRanch, listAnimalDocuments, listAnimalMovements, listBreeding, listIdentifiers, listObservations, listVaccinations, listWeights } from "@/lib/api";
import { isLocale } from "@/lib/i18n/config";
import { getI18n, getLocale, pageTitle } from "@/lib/i18n/server";
import { RecordsSheet } from "@/components/records/RecordsSheet";
import { RecordsDocuments } from "@/components/records/RecordsDocuments";
import { RecordsSale } from "@/components/records/RecordsSale";
import { RecordsToolbar } from "@/components/records/RecordsToolbar";
import { isSectionId } from "@/components/records/sections";
import { PageHeader } from "@/components/ui";
import { animalLabel } from "@/lib/format";

export const generateMetadata = pageTitle("Print records");

export default async function AnimalRecordsPage({ params, searchParams }: PageProps<"/animals/[id]/records">) {
  const { id } = await params;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const animal = await getAnimal(id);
  if (!animal) notFound();

  // The printout has its own language (a buyer may not read the language the app is in).
  const ui = await getI18n();
  const uiLocale = await getLocale();
  const requested = one(sp.lang);
  const lang = isLocale(requested) ? requested : uiLocale;
  const skip = (one(sp.skip) ?? "").split(",").filter(isSectionId);

  const [ranch, identifiers, vaccinations, observations, breeding, weights, movements, documents, tagOf, sire, dam] = await Promise.all([
    getRanch(animal.ranch_id),
    listIdentifiers(id),
    listVaccinations(id),
    listObservations(id),
    listBreeding(id),
    listWeights(id),
    listAnimalMovements(id),
    listAnimalDocuments(id),
    getAnimalTags(),
    animal.sire_id ? getAnimal(animal.sire_id) : null,
    animal.dam_id ? getAnimal(animal.dam_id) : null,
  ]);

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={ui.t("Print records")} subtitle={ui.t("Choose what to include, then print or save as a PDF.")} back={{ href: `/animals/${id}`, label: animal.tag_id }} />
      </div>
      {/* Wide screens: print box + preview in a 3/4 column, documents in a sticky 1/4 column beside them.
          Narrower screens stack: print box, documents, then the preview. */}
      <div className="grid gap-5 xl:grid-cols-[3fr_1fr] xl:items-start print:block">
        <RecordsToolbar lang={lang} skip={skip} className="xl:col-start-1 xl:row-start-1" />
        <div className="space-y-5 xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1 print:hidden">
          <RecordsDocuments
            animalId={id}
            documents={documents.map((d) => ({ id: d.id, title: d.title, doc_type: d.doc_type, size_kb: d.size_kb, file_name: d.file_name }))}
          />
          <RecordsSale animalId={id} status={animal.status} label={animalLabel(animal.tag_id, animal.nickname)} />
        </div>
        <div className="xl:col-start-1 xl:row-start-2">
          <RecordsSheet
            locale={lang}
            skip={skip}
            animal={animal}
            ranch={ranch}
            sire={sire}
            dam={dam}
            identifiers={identifiers}
            vaccinations={vaccinations}
            observations={observations}
            breeding={breeding}
            weights={weights}
            movements={movements}
            documents={documents}
            tagOf={tagOf}
          />
        </div>
      </div>
    </>
  );
}
