/**
 * Where the browser fetches a document's file. Today this is a route that serves a placeholder PDF.
 * With file storage connected, keep this URL and make the route redirect to a short-lived signed S3
 * URL (or return that URL from the API). Callers should not need to change.
 */
export const documentDownloadUrl = (documentId: string) => `/api/documents/${documentId}/download`;
