/**
 * Builds a tiny, valid one-page PDF (Helvetica text) with no dependencies. Used as a stand-in for a
 * document's real file until file storage is connected. Non-ASCII characters become "?".
 */
export function placeholderPdf(lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/[^\x20-\x7e]/g, "?").replace(/([\\()])/g, "\\$1");
  // Wrap long lines so they stay inside the page margins (Helvetica 11pt is ~90 chars across).
  const wrapped = lines.flatMap((line) => {
    const out: string[] = [];
    let cur = "";
    for (const word of line.split(" ")) {
      if ((cur + " " + word).trim().length > 84) {
        out.push(cur);
        cur = word;
      } else cur = (cur + " " + word).trim();
    }
    out.push(cur);
    return out;
  });

  const content = ["BT", "/F1 11 Tf", "14 TL", "56 740 Td", ...wrapped.map((l, i) => (i === 0 ? `(${esc(l)}) Tj` : `T* (${esc(l)}) Tj`)), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  // Everything is ASCII, so string length equals byte length and the xref offsets are exact.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
