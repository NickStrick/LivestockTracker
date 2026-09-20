import { getDocument } from "@/lib/api";
import { placeholderPdf } from "@/lib/placeholderPdf";
import { DOC_TYPE_FULL } from "@/lib/format";

/**
 * GET /api/documents/{id}/download
 * PLACEHOLDER: there is no file storage yet, so this returns a small generated PDF describing the
 * document. Replace the body with a redirect to a signed S3 URL once the compliance-service and
 * bucket exist; the URL the app links to stays the same.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/documents/[id]/download">) {
  const { id } = await ctx.params;
  const doc = await getDocument(id);
  if (!doc) return new Response("Document not found", { status: 404 });

  const bytes = placeholderPdf([
    "Estancia - placeholder document",
    "",
    `Title: ${doc.title}`,
    `Type: ${DOC_TYPE_FULL[doc.doc_type] ?? doc.doc_type}`,
    `Issued: ${doc.issued_at.slice(0, 10)}`,
    `Expires: ${doc.expires_at ? doc.expires_at.slice(0, 10) : "Never"}`,
    `Issued by: ${doc.issued_by}`,
    `Original file name: ${doc.file_name}`,
    "",
    "This is a stand-in file. The original document will be served from secure storage once the backend is connected.",
  ]);

  const filename = doc.file_name.replace(/[^A-Za-z0-9._-]/g, "_");
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
    },
  });
}
