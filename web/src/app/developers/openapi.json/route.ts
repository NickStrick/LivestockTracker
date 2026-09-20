import { buildOpenApi } from "@/lib/devspec/build";

/** GET /developers/openapi.json: the proposed OpenAPI 3.1 document (swagger baseline + everything the frontend needs). */
export function GET() {
  return Response.json(buildOpenApi(), { headers: { "Cache-Control": "public, max-age=300" } });
}
