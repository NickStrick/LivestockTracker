"use client";

import Link from "next/link";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "@/lib/i18n/client";
import { documentDownloadUrl } from "@/lib/documents";
import { DOC_TYPE_LABEL } from "@/lib/format";
import { Card, CardHeader, ProvisionalNote } from "@/components/ui";
import { btn } from "@/components/ui-styles";

export interface RecordDocument {
  id: string;
  title: string;
  doc_type: string;
  size_kb: number;
  file_name: string;
}

/**
 * Download the animal's original documents without leaving the print page. Screen-only.
 * Sits beside the print box on wide screens; the download button is icon-only whenever the card is
 * narrow (container query), so titles keep their room.
 */
export function RecordsDocuments({ animalId, documents, className }: { animalId: string; documents: RecordDocument[]; className?: string }) {
  const { t, fmtSize } = useI18n();
  return (
    <Card className={clsx("@container print:hidden", className)}>
      <CardHeader title={t("Original documents")} icon={faFileLines} action={<ProvisionalNote>{t("Placeholder files until storage is connected")}</ProvisionalNote>} />
      {documents.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted sm:px-5">
          {t("No documents on file for this animal.")}{" "}
          <Link href={`/compliance/documents/new?animal=${animalId}`} className="font-medium text-primary hover:underline">
            {t("Upload document")}
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-info/15 text-info">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words text-sm font-medium leading-snug">{d.title}</p>
                <p className="truncate text-xs text-muted">
                  {t(DOC_TYPE_LABEL[d.doc_type])} · {fmtSize(d.size_kb)}
                </p>
              </div>
              <a
                href={documentDownloadUrl(d.id)}
                download={d.file_name}
                aria-label={t("Download {title}", { title: d.title })}
                title={t("Download")}
                className={clsx(btn.ghost, "h-10 w-10 shrink-0 px-0 @sm:w-auto @sm:px-3")}
              >
                <FontAwesomeIcon icon={faDownload} />
                <span className="sr-only @sm:not-sr-only">{t("Download")}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
