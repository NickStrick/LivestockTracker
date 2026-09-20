import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { listAnimals, listRanches } from "@/lib/api";
import { AnimalsExplorer } from "@/components/animals/AnimalsExplorer";
import { PageHeader } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle("Animals");

export default async function AnimalsPage() {
  const { t } = await getI18n();
  const [animals, ranches] = await Promise.all([listAnimals(), listRanches()]);
  return (
    <>
      <PageHeader
        title={t("Animals")}
        subtitle={t("Every animal across your ranches")}
        actions={
          <Link href="/animals/new" className={btn.primary}>
            <FontAwesomeIcon icon={faPlus} /> {t("Add animal")}
          </Link>
        }
      />
      <AnimalsExplorer animals={animals} ranches={ranches.map((r) => ({ id: r.id, name: r.name }))} />
    </>
  );
}
