import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { buildView } from "@/lib/devspec/build";
import { DevReference } from "@/components/developers/DevReference";

const DL = "inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium transition hover:bg-surface2";

export default function DevelopersPage() {
  const view = buildView();
  return (
    <>
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Developer reference</h1>
        <p className="mt-2 text-muted">
          What the Estancia frontend needs from the backend: the endpoints to add, the schemas to define, and the existing ones that change. The screens run on example data today; each entry names the function in <code className="font-mono text-sm">src/lib/api.ts</code> that your endpoint will replace.
        </p>
        <p className="mt-2 text-sm text-muted">
          Baseline: the <b className="font-semibold">{view.baseline.title}</b> swagger {view.baseline.version}. Everything is compared against it, so <i>New</i>, <i>Changed</i> and <i>Exists</i> are worked out, not typed by hand. Spec version {view.updated}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/developers/openapi.json" download="estancia-openapi-proposed.json" className={DL}>
            <FontAwesomeIcon icon={faDownload} /> Proposed OpenAPI (JSON)
          </a>
          <a href="/developers/backlog.md" download="estancia-backend-backlog.md" className={DL}>
            <FontAwesomeIcon icon={faDownload} /> Backlog checklist (Markdown)
          </a>
        </div>
      </div>
      <DevReference view={view} />
    </>
  );
}
