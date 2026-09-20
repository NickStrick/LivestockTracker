import { buildBacklog } from "@/lib/devspec/build";

/** GET /developers/backlog.md: a checklist of everything to build or change, ready to paste into tickets. */
export function GET() {
  return new Response(buildBacklog(), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
