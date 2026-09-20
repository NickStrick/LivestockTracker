import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getAnimal, getRanch } from "@/lib/api";
import { getI18n, pageTitle } from "@/lib/i18n/server";
import { QrTagPrinter } from "@/components/animals/qr/QrTagPrinter";
import { PageHeader } from "@/components/ui";

export const generateMetadata = pageTitle("QR tag");

/** The address the app is being served from, so the QR points at the same site the person is on. */
async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/.test(host);
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? (local ? "http" : "https");
  return { origin: `${proto}://${host}`, local };
}

export default async function AnimalQrPage({ params }: PageProps<"/animals/[id]/qr">) {
  const { t } = await getI18n();
  const { id } = await params;
  const animal = await getAnimal(id);
  if (!animal) notFound();
  const ranch = await getRanch(animal.ranch_id);

  // Scanning opens the animal's page. The animal's id (not its tag) is in the address, so re-tagging never breaks a printed code.
  const { origin, local } = await siteOrigin();
  const url = `${origin}/animals/${id}`;
  // Error correction "Q" (25%) so a tag that is scuffed or muddy still scans. Quiet zone of 2 modules.
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 2 });

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={t("QR tag")} subtitle={t("Print a QR code for this animal's ear tag. Scanning it opens this animal's page.")} back={{ href: `/animals/${id}`, label: animal.tag_id }} />
      </div>
      <QrTagPrinter svg={svg} url={url} local={local} tag={animal.tag_id} nickname={animal.nickname ?? null} ranch={ranch?.name ?? null} />
    </>
  );
}
