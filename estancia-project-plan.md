# Livestock Management Platform — MVP v1 Project Plan

**Owner:** Solo developer
**Timeline model:** Flexible, sprint-paced (no fixed calendar deadline)
**Scope:** MVP v1 backend (4 microservices) + frontend web app, both containerized, deployed to an AWS sandbox on EKS

---

## 1. Architecture Summary

- **Compute:** EKS cluster, one microservice per Deployment/Service: `animal-service`, `health-service`, `gps-service`, `compliance-service`
- **Ingress:** ALB via AWS Load Balancer Controller, path-based routing (ADR-004)
- **Data:** RDS PostgreSQL + PostGIS, shared instance, logical ownership per service
- **Storage:** S3 for documents (registry papers) and future data-lake export
- **Eventing:** `domain_events` outbox table per service + EventBridge/SQS, no active subscribers at MVP
- **Batch/ETL (planned, v1.1):** run-to-completion Kubernetes Jobs/CronJobs — distinct from the always-on Deployments above — for customer data migration and future ML/ETL exports.
- **Frontend:** React SPA, containerized separately, calls the backend through the same ALB ingress
- **Deployment model:** vendor-managed SaaS — production infrastructure runs in AWS account(s) owned and operated by the software author, not the customer; this plan targets **one shared sandbox AWS account** for MVP development

## 2. GitLab Project Setup

```
livestock-platform/
├── services/
│   ├── animal-service/
│   ├── health-service/
│   ├── gps-service/
│   ├── compliance-service/
│   ├── batch-service/         # placeholder — see Section 10, not built at MVP
│   └── shared/                # shared Pydantic models, DB session, auth deps
├── frontend/                  # React SPA
├── infra/
│   ├── terraform/             # VPC, EKS, RDS, S3, ECR, IAM (sandbox + prod modules)
│   ├── ansible/               # Playbooks and roles for kubernetes blue-green deployments, canary releases, rollbacks, etc 
│   └── k8s/                   # Deployment/Service/Ingress manifests (Helm or Kustomize)
├── scripts/
│   └── seed/                  
│       ├── generators.py
│       ├── scenarios/         # deterministic, hand-crafted mock-ranch datasets
│       └── seed_data.py       # CLI entry point
├── docs/
│   ├── architecture/          # ADRs, diagrams
│   └── api/                   # OpenAPI specs (auto-generated from FastAPI)
├── .gitlab-ci.yml
└── README.md
```

**Branching:** trunk-based — short-lived feature branches off `main`, merge via MR. No `develop` branch needed at solo scale; `main` always deploys to sandbox.

**CI/CD pipeline (`.gitlab-ci.yml`), full automation per your answer:**

| Stage | What happens |
|---|---|
| `lint` | ruff/black check (Python) + SAST (Bandit) + SCA (`pip-audit`) per service, eslint (frontend) |
| `test` | spin up an ephemeral Postgres/PostGIS service container; run `scripts/seed/seed_data.py --scenario ci-fast` to populate it; run pytest unit + integration + e2e against the seeded data |
| `build` | Docker build, one image per service that changed (`rules: changes:`) — avoids rebuilding all services on every commit |
| `push` | push tagged images to ECR |
| `deploy` | apply/upgrade Kubernetes manifests (Helm) to the sandbox EKS namespace, using the **GitLab agent for Kubernetes** (avoids storing a long-lived kubeconfig as a CI variable) |

Auto-deploy triggers on merge to `main`. Recommend keeping a manual approval gate on `deploy` initially even though it's automated end-to-end — one click, but it stops a bad merge from silently redeploying sandbox while you're mid-debugging something else.

## 3. Primary Features & Use Cases (MVP v1 scope)

| Feature | Service | Use case |
|---|---|---|
| Animal CRUD + identifiers | animal-service | Register, update, retire an animal; attach RFID/EID |
| Ranch/zone management | animal-service | Onboard a ranch, draw perimeter, define zones (pasture/water/dangerous_terrain/forest/paddock/quarantine) |
| Vaccinations | health-service | Record administration, dosage, next-due date |
| Health observations | health-service | Log symptoms/routine checks |
| Breeding events | health-service | Record heat/insemination/calving |
| Weight records | health-service or animal-service | Track weight over time |
| GPS ingestion + geofencing | gps-service | Ingest pings, flag boundary breaches |
| Movement records | compliance-service | Log interstate/intrastate movement |
| Compliance documents | compliance-service | Store/expire regulatory documents |
| Audit trail | all services → shared table | Full event history per animal |
| Domain event outbox | all services | Publish-ready event stream, no consumer yet |

**Out of scope for MVP v1** (deferred to v1.1 per the earlier schema split, plus this session's additions): sale lots/sales, feed events, reminders, mobile client, ML pipeline consumers, **CSV customer-data-migration import, batch-processing/ETL service** (both new — see Section 10).

## 4. Test Case Scenarios

| # | Scenario | Layer | Expected result |
|---|---|---|---|
| 1 | Create animal with valid data | Unit | 201, row created, `audit_events` row written in same transaction |
| 2 | Create animal with duplicate `tag_id` | Unit | 409 conflict |
| 3 | Attach duplicate RFID `identifier` | Unit | 409 conflict (unique constraint) |
| 4 | Soft-delete (status change) preserves history | Integration | Animal `status=sold`, all prior audit/vaccination/GPS rows still queryable |
| 5 | Vaccination recorded with dosage | Unit | 201, `next_due_at` computed correctly |
| 6 | GPS ping inside ranch boundary | Integration | No breach event |
| 7 | GPS ping outside ranch boundary | Integration | `audit_events` row `event_type=geofence_breach` + `domain_events` row created |
| 8 | Movement record with CVI attached | Integration | `movement_records` + `compliance_documents` + `documents` rows linked correctly |
| 9 | Full lifecycle audit trail | E2E | Create animal → vaccinate → move → GPS breach → `GET /audit-trail` returns all 4 events in order |
| 10 | Outbox publish worker | Integration | `domain_events.published_at` set after publish; retried on failure |
| 11 | JWT missing/invalid | Unit | 401 on any protected route |
| 12 | Role-restricted write (e.g., vet-only vaccination entry) | Unit | 403 for wrong role |
| 13 | Ranch polygon onboarding | Integration | Valid GeoJSON stored as `geography(Polygon,4326)`, invalid polygon rejected with 422 |

Automated tests remain the source of truth for correctness — Section 5's seed data makes these faster to write and run against, but never replaces them.

## 5. Test Data Strategy (elaborated)

The original plan called for a single `seed_data.py` script. Based on this session's discussion, it's worth elaborating into a small internal package rather than one file, since it now needs to serve three distinct needs:

- **Randomized volume data** (original purpose): realistic-but-synthetic ranches, animals, lineage, vaccination/health/breeding history, and GPS trails — including a deliberate percentage of pings forced outside ranch boundaries, specifically to exercise the geofence-breach test case.
- **Deterministic scenarios**: hand-crafted, reproducible datasets (e.g., "a 40-head cow-calf operation with two known geofence breaches and one overdue vaccination") for scenarios that need to be exactly repeatable — both for demoing specific features and, later, as the model for what a customer-migration CSV import needs to handle correctly.
- **CI-fast seeding**: a small, quick-to-generate dataset sized for CI runtime, seeded fresh into the ephemeral CI database before integration/e2e tests run, per your request to use this "even during CI/CD runs."

Proposed structure (see Section 2's repo tree):

```
scripts/seed/
├── generators.py     # Faker-based random generation (existing logic)
├── scenarios/         # YAML/JSON deterministic scenario definitions
└── seed_data.py       # CLI: --scenario random|ci-fast|<named-scenario>
```

This is a **refactor of the existing plan, not a new component** — same script, same purpose, structured so it can grow into the CSV-migration groundwork described in Section 10 without a rewrite.

## 6. Minimum IaC for AWS Sandbox

Terraform, kept intentionally minimal for a sandbox (not production-hardened):

- **VPC:** 2 AZs, public + private subnets — enough for ALB (public) and EKS nodes/RDS (private)
- **EKS cluster:** one managed node group (2× small instances) — a managed node group rather than Fargate here, since the explicit goal is hands-on node/workload management
- **RDS:** single-AZ, small instance class, PostGIS extension enabled via a bootstrap SQL migration
- **S3:** one bucket for documents/data-lake exports
- **ECR:** one repository per service
- **IAM:** IRSA roles scoped per service (S3 access for compliance-service, Secrets Manager access for all)
- **Secrets Manager:** DB credentials, JWT signing key
- **AWS Load Balancer Controller:** installed via Helm, not Terraform-managed (cluster add-on)

This sandbox module is deliberately separate from the eventual production module (in the vendor's own AWS account) — same shape, smaller sizing, torn down/rebuilt freely without affecting production.

## 7. Sprint Plan (MVP v1)

Sprints are 2 weeks each as a working default — adjust pace freely since there's no fixed deadline. Each sprint has a goal and exit criteria so you always know what "done" means before moving on.

| Sprint | Goal | Key tasks | Exit criteria |
|---|---|---|---|
| **0 — Foundation** | Repo, animal-service | Build `animal-service` (animals, identifiers, ranches) | 
| **1 — CI/CD** | CI Skeleton, `.gitlab-ci.yml` | Basic CI/CD `.gitlab-ci.yml` (lint+test only)pipeline, CRUD works via `invoke smoke` |
| **2 — Sandbox Infrastructure ** | Sandbox infra | Write Terraform for VPC/EKS/RDS/S3/ECR; get `terraform apply` working end to end; | Sandbox EKS cluster running, empty; CI passes on a hello-world commit |
| **3 — Health service** | Vaccinations, health, breeding | Build `health-service`; shared auth dependency extracted to `services/shared`; unit tests (#1-5, #11, #12) | Vaccination + health endpoints live in sandbox, Alembic migrations, services deployed to sandbox |
| **4 — GPS/geofence service** | Ingestion + boundary checks | Build `gps-service`; PostGIS `ST_Contains` breach logic; integration tests (#6, #7) | Breach detection verified against seeded data |
| **5 — Compliance service** | Movement + documents | Build `compliance-service`; S3 document upload/link; integration tests (#8, #13) | Movement + document flow works end to end |
| **6 — Audit trail + outbox** | Cross-service history, event publishing | Shared `audit_events` write pattern finalized across all 4 services; outbox publisher worker (CronJob or long-running pod); e2e test #9, integration test #10 | `GET /audit-trail` returns a correct, ordered, cross-service history |
| **7 — Frontend MVP** | Usable UI | React SPA: animal list/detail, ranch map (draw + display perimeter), vaccination/health forms, audit trail viewer; containerize frontend | Frontend deployed to sandbox, can perform every core use case from Section 3 through the UI |
| **8 — Test data + full CI/CD hardening** | Realistic data, full pipeline | Elaborate `scripts/seed/` per Section 5; full `.gitlab-ci.yml` (build/push/deploy stages, CI-fast seeding wired into the `test` stage); manual approval gate on deploy | One-click merge-to-deploy works reliably; CI seeds and tests against fresh data every run |
| **9 — Security Coverage** | SAST/SCA/DAST/IAST wired into the pipeline | SAST (Bandit/Semgrep) + SCA (`pip-audit`) run per-service in CI already, added incrementally to the `lint` stage as each service landed rather than waiting for this sprint; this sprint adds Terraform SAST (tfsec/Checkov), frontend SAST/SCA (Semgrep JS/TS, `npm audit`), a DAST scan (OWASP ZAP baseline) against the sandbox deployment, and a time-boxed IAST evaluation spike — Python/FastAPI has thin native IAST vendor support, so the spike's output may legitimately be "not viable for this stack," not a working agent | A `security` CI stage runs SAST+SCA+DAST for every service and either passes or has each failure explicitly triaged in a findings doc under `docs/architecture/`; the IAST spike concludes with a documented recommendation either way |
| **10 — Hardening + demo readiness** | Polish, docs, UAT | Fill test coverage gaps; finalize architecture docs/ADRs in `docs/`; do a full walkthrough of every use case against the deployed sandbox | You can demo the entire MVP — onboarding through audit trail — against the live sandbox, backend and frontend both containerized and running on EKS |

## 8. Risks & Assumptions

- **Assumption:** sandbox AWS account has sufficient service quotas (EKS, RDS, EIPs) — verify before Sprint 0.
- **Risk:** solo development means context-switching cost between 4 services is real; the sprint order above is deliberately sequential (one service fully working before the next starts) rather than parallel, to minimize half-finished services at any time.
- **Risk:** PostGIS geofencing correctness depends on realistic polygon test data — the seed script's deliberate "some pings outside the boundary" design exists specifically to catch false negatives here.
- **Assumption:** no real customer data touches the sandbox — it's synthetic-only, so compliance/security hardening for the sandbox itself can stay lighter than production.

## 9. Definition of Done — MVP v1

- All 4 microservices deployed and reachable through the ALB ingress in the sandbox EKS cluster
- Frontend deployed as its own container, functional against all core use cases
- All 13 test scenarios in Section 4 passing in CI, seeded via `scripts/seed/seed_data.py --scenario ci-fast`
- Seed script produces both randomized and deterministic datasets, reproducibly
- GitLab CI/CD pipeline runs lint → test (with seeding) → build → push → deploy on every merge to `main`
- Architecture docs and ADRs in `docs/architecture/` reflect the as-built system