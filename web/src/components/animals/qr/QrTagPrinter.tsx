"use client";

import { useState } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faMinus, faPlus, faPrint, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "@/lib/i18n/client";
import { Card } from "@/components/ui";
import { btn } from "@/components/ui-styles";
import { animalLabel } from "@/lib/format";

/** QR side lengths (inches) to offer. Below ~0.75 in a phone camera struggles to read the code. */
const SIZES = [0.75, 1, 1.5, 2];
const MAX_COPIES = 48;

const save = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/**
 * Screen controls plus the printable sheet of labels. Only the sheet prints; sizes are real inches,
 * so a 1 in label is 1 in on paper (print at 100% / "Actual size", not "Fit to page").
 */
export function QrTagPrinter({ svg, url, local, tag, nickname, ranch }: { svg: string; url: string; local: boolean; tag: string; nickname: string | null; ranch: string | null }) {
  const { t } = useI18n();
  const [size, setSize] = useState(1);
  const [copies, setCopies] = useState(2);
  const [showText, setShowText] = useState(true);
  const [busy, setBusy] = useState(false);

  const setCount = (n: number) => setCopies(Math.min(MAX_COPIES, Math.max(1, Math.round(n) || 1)));
  const sized = svg.replace("<svg ", '<svg width="1024" height="1024" ');
  const file = `${tag}-qr`;

  const png = async () => {
    setBusy(true);
    try {
      const img = new Image();
      const src = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = src;
      });
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(src);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (blob) save(blob, `${file}.png`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 print:hidden sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[auto_auto_1fr] lg:items-start">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("QR size")}</p>
            <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label={t("QR size")}>
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={clsx("h-9 rounded-lg px-3 text-sm font-medium transition-colors", size === s ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
                >
                  {s} in
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("Copies")}</p>
            <div className="inline-flex items-center rounded-xl border border-line bg-surface">
              <button type="button" aria-label={t("Fewer copies")} onClick={() => setCount(copies - 1)} disabled={copies <= 1} className="grid size-11 place-items-center rounded-l-xl text-muted hover:text-fg disabled:opacity-40">
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_COPIES}
                value={copies}
                onChange={(e) => setCount(Number(e.target.value))}
                aria-label={t("Copies")}
                className="h-11 w-14 bg-transparent text-center text-sm font-medium tabular-nums outline-none"
              />
              <button type="button" aria-label={t("More copies")} onClick={() => setCount(copies + 1)} disabled={copies >= MAX_COPIES} className="grid size-11 place-items-center rounded-r-xl text-muted hover:text-fg disabled:opacity-40">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>

          <div className="space-y-3 lg:justify-self-end">
            <label className="flex min-h-10 items-center gap-2.5 text-sm">
              <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} className="size-4 accent-primary" />
              {t("Print the tag and name under the code")}
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => window.print()} className={clsx(btn.primary, "h-11 px-5")}>
                <FontAwesomeIcon icon={faPrint} /> {t("Print")}
              </button>
              <button type="button" onClick={png} disabled={busy} className={clsx(btn.ghost, "h-11")}>
                <FontAwesomeIcon icon={faDownload} /> PNG
              </button>
              <button type="button" onClick={() => save(new Blob([sized], { type: "image/svg+xml" }), `${file}.svg`)} className={clsx(btn.ghost, "h-11")}>
                <FontAwesomeIcon icon={faDownload} /> SVG
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          {t("Print at 100% (“Actual size”), not “Fit to page”, so the code comes out at the size you chose. Cut along the dashed lines. For weatherproof tags, use a laminate or an outdoor label sheet, or send the PNG or SVG to your tag maker.")}
        </p>
        <p className="mt-2 break-all text-xs text-muted">
          {t("Scanning opens:")} <span className="font-mono">{url}</span>
        </p>
        {local && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
            <span>{t("This address only works on this computer or network. Open Estancia from its real web address before printing codes for tags, or a phone in the field won't be able to open them.")}</span>
          </p>
        )}
      </Card>

      {/* The sheet: always black on white (a code must be dark on light to scan), whatever the app theme. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white p-4 text-black print:rounded-none print:border-0 print:p-0 sm:p-6" data-testid="qr-sheet">
        <div className="flex flex-wrap items-start gap-3 print:gap-[0.1in]">
          {Array.from({ length: copies }, (_, i) => (
            <div key={i} className="break-inside-avoid border border-dashed border-neutral-400 bg-white p-[0.06in]" style={{ width: `${size + 0.14}in` }} data-testid="qr-label">
              <div style={{ width: `${size}in`, height: `${size}in` }} className="[&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label={t("QR code for {animal}", { animal: animalLabel(tag, nickname) })} />
              {showText && (
                <div className="mt-[0.04in] text-center leading-tight" style={{ fontSize: `${Math.max(0.11, size * 0.15)}in` }}>
                  <p className="break-words font-mono font-bold">{tag}</p>
                  {nickname && <p className="break-words">“{nickname}”</p>}
                  {ranch && size >= 1.5 && <p className="break-words text-[0.7em] text-neutral-600">{ranch}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
