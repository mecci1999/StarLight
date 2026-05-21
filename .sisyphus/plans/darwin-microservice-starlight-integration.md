# Darwin-App Microservice → StarLight Client Integration Execution Document

## TL;DR
> **Summary**: Integrate all current and future darwin-app microservices into StarLight through a single Event-based telemetry bridge in the starlight metrics service, then expose only normalized read-model APIs to the client. darwin-app system telemetry must be stored and projected as an admin-only dataset, while normal users continue using the existing AppKey/ingest flow unchanged.
> **Deliverables**:
> - node-universe Event telemetry contract for current/future darwin-app services
> - starlight metrics bridge/projector for system telemetry
> - admin-only read-model partition and API authorization
> - client-side admin-only system scope/preset using existing panel-first model
> - future microservice onboarding contract/runbook
> **Effort**: XL
> **Parallel**: YES - 4 waves
> **Critical Path**: Contract freeze → bridge/projector → admin authorization boundary → client admin scope wiring → rollout/runbook

## Context
### Original Request
Create a very detailed execution document that integrates all existing and future darwin-app microservices into the StarLight client using the recommended Event-based scheme. Only admin accounts may see darwin-app system microservice data; all other users must continue through the normal AppKey/ingest flow. The document must be detailed enough to drive complete implementation.

### Interview Summary
- darwin-app core services already use `node-universe` with `metrics.reporter = { type: 'Event' }`.
- gateway already listens to `'$metrics.snapshot'` and rebroadcasts websocket `metrics` messages, but that path is not the source of truth for client read-models.
- starlight metrics service already owns ingest/read-model responsibilities and is the correct landing zone for telemetry bridge/projector logic.
- StarLight client currently consumes service-centric read-model APIs (`catalog/services`, `overview/*`, `service/detail`, `service/runtime`) and should continue to do so.
- `/home/overview` is already panel-first and widget-configurable, but widgets must remain bound to platform metric keys/read-model datasets, not arbitrary raw metric names.
- Admin-only visibility is a hard security requirement; client-side `localStorage.isAdmin` is not an authorization boundary.

### Metis Review (gaps addressed)
- Freeze the canonical event envelope, service identity contract, visibility model, and replay/idempotency semantics before implementation.
- Prevent scope creep: do not redesign the whole telemetry platform, do not turn Overview into an arbitrary raw-query builder, and do not couple future microservice onboarding to per-service frontend code.
- Explicitly cover edge cases: event-name drift, interval-unit ambiguity, duplicate/replayed events, malformed payloads, service rename/merge, admin role downgrade, cached dataset leakage, and mixed-visibility datasets.
- Add acceptance criteria proving no non-admin path can list, fetch, infer, or aggregate system telemetry.

## Work Objectives
### Core Objective
Build a decision-complete integration path where darwin-app microservices emit Event-based telemetry once, starlight metrics service becomes the sole bridge/projector into normalized StarLight read-models, and admin users can explicitly view darwin-app system telemetry in the client without affecting normal-user AppKey ingest flows.

### Deliverables
- Canonical darwin-app system telemetry contract for Event reporter output
- Label governance and service identity normalization spec
- starlight metrics bridge/projector design and rollout tasks
- Admin-only system dataset partition for metrics storage/read-models
- API authorization plan across gateway/auth/metrics endpoints and websocket channels
- Client-side admin-only dataset discovery/scope/preset integration for panel-first Overview and service views
- Current-service onboarding matrix and future-service onboarding checklist/template
- Verification, rollout, fallback, and operations runbook

### Definition of Done (verifiable conditions with commands)
- darwin-app system telemetry is ingested through the metrics bridge and appears in normalized read-model APIs only for admins.
- Non-admin responses from `catalog/services`, `overview/*`, `service/detail`, `service/runtime`, websocket subscriptions, and query endpoints contain zero darwin-app system telemetry.
- Existing AppKey/ingest workflows for regular users are unchanged.
- A newly created darwin-app microservice appears in StarLight without client code changes when it follows the contract.
- Panel-first Overview can show admin-only system datasets using existing widget contracts and platform metric keys.
- Commands expected to pass after implementation:
  - `npm run build` (StarLight)
  - repository-specific test/build commands for darwin-app services touched by the implementation
  - targeted API/integration tests for auth boundary, projector mapping, and replay safety

### Must Have
- Single authoritative ingestion bridge in starlight metrics service
- Reserved identity namespace for darwin-app system services
- Admin-only visibility enforced server-side, not just hidden in UI
- Stable platform metric keys/read-models for the client
- Onboarding rules for all future darwin-app microservices
- Idempotent/replay-safe projector behavior

### Must NOT Have
- No direct client consumption of `'$metrics.snapshot'`
- No reliance on `localStorage.isAdmin` for authorization
- No mixing of system telemetry into normal-user aggregates
- No requirement for each future microservice to add bespoke client code
- No arbitrary raw-metric editing/query builder added to panel-first Overview in this initiative
- No dual source of truth between websocket broadcast and metrics projector

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + repository-specific automated tests for bridge/projector/auth boundary; existing frontend build/test infrastructure retained.
- QA policy: Every task includes agent-executed happy-path and failure-path scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Contract freeze, identity/visibility rules, current-service inventory, current endpoint security inventory
Wave 2: Bridge/projector implementation design, dataset partitioning, API authorization, websocket policy
Wave 3: Client read-model/admin scope integration, panel/preset integration, current-service onboarding
Wave 4: Future-service onboarding template, rollout/migration, observability/runbook, regression verification

### Dependency Matrix (full, all tasks)
- T1 blocks T4-T14
- T2 blocks T5-T14
- T3 blocks T4, T6, T8, T9, T10
- T4 blocks T6, T7, T8
- T5 blocks T7, T8, T11
- T6 blocks T8, T9, T10
- T7 blocks T10, T12
- T8 blocks T10, T11
- T9 blocks T10
- T10 blocks T11, T12
- T11 blocks T13
- T12 blocks T13
- T13 blocks T14
- T14 blocks Final Verification Wave

### Agent Dispatch Summary
- Wave 1 → 3 tasks → deep / oracle / writing
- Wave 2 → 5 tasks → deep / unspecified-high / quick
- Wave 3 → 4 tasks → deep / visual-engineering / unspecified-high
- Wave 4 → 2 tasks → writing / deep

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Freeze canonical darwin system telemetry contract

  **What to do**: Define the single supported Event payload contract for darwin-app internal telemetry. Freeze canonical event name (`$metrics.snapshot`), schema versioning, required metadata block, timestamp unit, idempotency key, replay semantics, label normalization rules, and the reserved namespace/identity convention for system services (e.g. `system:<service>`). Resolve the current repo ambiguity between `$metrics.snapshot` and custom names like `metrics.report`, and explicitly correct the EventReporter interval unit assumption in all service configs.
  **Must NOT do**: Do not leave event naming/service identity/reporter interval as “follow existing behavior”; do not allow per-service custom payload shapes.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Cross-service contract freeze with multiple hidden coupling points.
  - Skills: `[]` - No special skill required.
  - Omitted: [`frontend-design`] - Backend/platform contract task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [4,5,6,7,8,9,10,11,12,13,14] | Blocked By: []

  **References**:
  - Pattern: `node-universe/src/lib/metrics/reporters/event.ts:15-63` - Event reporter default event name, interval semantics, snapshot emission model.
  - Pattern: `node-universe/src/lib/metrics/registry.ts:116-122,286-306` - Registry change fan-out and `list()` snapshot source.
  - Pattern: `node-universe/src/typings/metric/index.ts:22-33,91-98` - Reporter options and metric POJO shape.
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:172-180` - Current hard dependency on `$metrics.snapshot`.
  - Pattern: `darwin-app/src/apps/starlight/metrics/index.ts:259-267` - Existing custom event-name/interval divergence.

  **Acceptance Criteria**:
  - [ ] A single documented event contract exists with required/optional fields, schema version, timestamp unit, and replay/idempotency rules.
  - [ ] The document explicitly resolves event-name inconsistency and interval-unit ambiguity.
  - [ ] The contract defines one reserved namespace/identity rule preventing collision with AppKey/user service IDs.

  **QA Scenarios**:
  ```
  Scenario: Contract matches current code hotspots
    Tool: Bash
    Steps: Run repo searches confirming every service metrics reporter and gateway listener are covered by the contract decisions.
    Expected: All current Event reporter emitters and listeners can be mapped to the frozen contract with no unresolved naming/unit ambiguity.
    Evidence: .sisyphus/evidence/task-1-contract-audit.txt

  Scenario: Invalid contract variants are rejected by spec
    Tool: Bash
    Steps: Review the document/spec against known bad cases: custom event names, missing metadata block, milliseconds-vs-seconds interval confusion.
    Expected: Each bad case has an explicit rejection/normalization rule.
    Evidence: .sisyphus/evidence/task-1-contract-errors.txt
  ```

  **Commit**: YES | Message: `feat(metrics): freeze darwin system telemetry contract` | Files: [darwin-app metrics contract/types/config docs]

- [ ] 2. Freeze service identity and visibility model

  **What to do**: Define the canonical service identity registry for all current and future darwin-app microservices, including `serviceId`, `serviceName`, `owner`, `team`, `env`, `region`, `runtime`, `tags`, `nodeIds`, `sourceType`, and `visibilityScope`. Decide the authoritative source for each field and document the fallback rules. Define the storage/read-model partition rules so darwin-app system telemetry is always tagged `system-admin` and excluded from normal-user paths by default.
  **Must NOT do**: Do not derive identity opportunistically from raw labels alone; do not mix system/admin visibility into tenant/AppKey namespaces.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Identity and visibility are foundational to every downstream view.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Not a UI task.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [5,6,7,8,9,10,11,12,13,14] | Blocked By: []

  **References**:
  - API/Type: `StarLight/src/types/monitor.ts:1-17` - Client `ServiceItem` identity/shape expectations.
  - Pattern: `StarLight/src/domains/service/pages/ServiceCatalogPage.tsx:85-110` - Service catalog identity fields actually consumed.
  - Pattern: `darwin-app/src/apps/starlight/metrics/index.ts:442-470` - Current mock service identity fields needing formal source of truth.
  - External: `docs/refactor/backend-api-contract-v1.md:44-105` - Existing panel capability/read-model boundary.

  **Acceptance Criteria**:
  - [ ] A canonical service identity object and source-of-truth table exist for all current/future services.
  - [ ] Visibility scopes are explicitly defined and default filtering rules are frozen.
  - [ ] The plan covers rename/merge/new-service onboarding without client ID collisions.

  **QA Scenarios**:
  ```
  Scenario: Identity model covers current service catalog fields
    Tool: Bash
    Steps: Compare the frozen identity model against all fields consumed by StarLight service/overview pages.
    Expected: No consumed identity field lacks a defined source/fallback.
    Evidence: .sisyphus/evidence/task-2-identity-map.txt

  Scenario: Visibility partition prevents leakage by aggregation
    Tool: Bash
    Steps: Review overview/catalog/detail aggregate rules in the plan against the visibility model.
    Expected: The plan explicitly excludes `system-admin` data from all default/non-admin aggregates.
    Evidence: .sisyphus/evidence/task-2-visibility-audit.txt
  ```

  **Commit**: YES | Message: `feat(metrics): define service identity and visibility model` | Files: [darwin-app metrics identity types/docs]

- [ ] 3. Inventory current emitters, listeners, and read-model consumers

  **What to do**: Build the authoritative inventory of all current darwin-app services already using Event metrics (`gateway`, `auth`, `user`, `file`, `metrics`, `logs`, `metrics-alerts`, `subscription`, `metrics-compat`, and any others found), all current listeners of metrics events, and every StarLight client API/page that consumes service/overview/admin data. Mark each emitter as “contract compliant”, “needs rename”, “needs metadata”, or “needs interval fix”.
  **Must NOT do**: Do not assume only the four core services matter; do not leave future service inventory rules undefined.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Broad inventory and cross-repo cross-checking.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Inventory task.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4,6,8,9,10] | Blocked By: []

  **References**:
  - Pattern: `darwin-app/src/core/gateway/index.ts:183-188`, `core/auth/index.ts:94-99`, `core/user/index.ts:61-66`, `core/file/index.ts:60-65` - Current Event reporter baseline.
  - Pattern: `darwin-app/src/apps/starlight/metrics/index.ts:259-267` - Divergent metrics reporter options.
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:166-218` - Listener inventory starting point.
  - Pattern: `StarLight/src/api/metrics.ts:32-80` - Client consumption endpoints.

  **Acceptance Criteria**:
  - [ ] The execution document contains a current-service integration matrix with remediation status per service.
  - [ ] Every current listener and consumer path is listed with explicit ownership.
  - [ ] Future-service onboarding rules reference this matrix structure.

  **QA Scenarios**:
  ```
  Scenario: Inventory matches repository reality
    Tool: Bash
    Steps: Search for `metrics: { enabled: true, reporter:` and all `$metrics.snapshot`/custom metrics event listeners.
    Expected: Every emitter/listener found in code exists in the integration matrix.
    Evidence: .sisyphus/evidence/task-3-emitter-inventory.txt

  Scenario: Consumer coverage is complete
    Tool: Bash
    Steps: Search StarLight for overview/catalog/service/admin metrics APIs and page consumers.
    Expected: Every client data consumer is mapped to a read-model owner in the plan.
    Evidence: .sisyphus/evidence/task-3-consumer-inventory.txt
  ```

  **Commit**: YES | Message: `docs(metrics): add darwin microservice integration inventory` | Files: [integration matrix docs]

- [ ] 4. Implement metrics bridge as the single authoritative darwin system intake

  **What to do**: Add bridge logic to the starlight metrics service so it becomes the only authoritative consumer/projector for darwin-app Event telemetry. Normalize raw `BaseMetricPOJO[]` payloads into an internal envelope, enforce contract/version validation, normalize labels, attach service identity metadata, assign visibility scope, and persist projector-ready records. Explicitly keep gateway websocket rebroadcast as a live-ops helper, not as a read-model source of truth.
  **Must NOT do**: Do not make gateway the persistence/projector owner; do not create a second source of truth.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Core backend integration and projector foundation.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Backend integration.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [6,7,8] | Blocked By: [1,3]

  **References**:
  - Pattern: `darwin-app/src/apps/starlight/metrics/index.ts:271-425` - Metrics service lifecycle and state.
  - Pattern: `darwin-app/src/apps/starlight/metrics/actions/ingest.ts:12-175` - Existing intake architecture style.
  - Pattern: `node-universe/src/lib/metrics/type/base.ts:157-165` - Metric POJO serialization contract.
  - Pattern: `node-universe/src/lib/metrics/reporters/event.ts:41-63` - Snapshot emission behavior.

  **Acceptance Criteria**:
  - [ ] A single bridge entrypoint exists in starlight metrics service for darwin system telemetry.
  - [ ] The bridge rejects/normalizes invalid event name, schema version, missing metadata, and malformed labels deterministically.
  - [ ] Bridge persistence is idempotent and replay-safe by documented key.

  **QA Scenarios**:
  ```
  Scenario: Valid darwin Event payload is normalized and stored once
    Tool: Bash
    Steps: Execute backend tests/integration harness with a representative `$metrics.snapshot` payload and replay it twice.
    Expected: One normalized projector state results; duplicate delivery does not double-count.
    Evidence: .sisyphus/evidence/task-4-bridge-happy.txt

  Scenario: Malformed/internal event is quarantined or rejected
    Tool: Bash
    Steps: Feed bad event name, missing metadata, and bad version payloads into the bridge test harness.
    Expected: The bridge rejects/quarantines deterministically without corrupting read-model state.
    Evidence: .sisyphus/evidence/task-4-bridge-error.txt
  ```

  **Commit**: YES | Message: `feat(metrics): add darwin system telemetry bridge` | Files: [darwin-app metrics bridge code/tests]

- [ ] 5. Enforce admin-only authorization across API and websocket boundaries

  **What to do**: Replace any client-trust-based admin gating with server-authoritative authorization. Use auth/user data to resolve admin role in gateway and metrics service, then enforce admin-only access for system datasets on all relevant endpoints and websocket subscriptions. Keep default APIs excluding system datasets unless an explicit admin scope is requested.
  **Must NOT do**: Do not rely on `localStorage.isAdmin`; do not hide admin-only data only in the UI.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Security boundary across auth, gateway, metrics, and websocket layers.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Security and API task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [7,8,10,12] | Blocked By: [1,2]

  **References**:
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:373-418` - Existing token resolution and `isAdmin` derivation.
  - Pattern: `StarLight/src/api/metrics.ts:23-30,155-167` - Current unsafe client-side admin switch for query path.
  - Pattern: `darwin-app/src/apps/starlight/metrics/actions/appkey.ts:472-517` - Existing admin-adjacent ingestion status action style.
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:172-218` - websocket/channel authorization touchpoints.

  **Acceptance Criteria**:
  - [ ] Non-admin users cannot list, fetch, infer, or subscribe to system telemetry through any API/websocket path.
  - [ ] Admin users can access system datasets only through explicit admin scope/preset routes.
  - [ ] Role downgrade/logout invalidates admin-only dataset visibility and websocket access.

  **QA Scenarios**:
  ```
  Scenario: Admin can access system dataset through authorized path
    Tool: Bash
    Steps: Run API/integration tests using an admin auth token against overview/catalog/detail/system scope endpoints and websocket channel subscription.
    Expected: Authorized responses include system telemetry only when explicit admin scope is requested.
    Evidence: .sisyphus/evidence/task-5-admin-happy.txt

  Scenario: Non-admin cannot access or infer system dataset
    Tool: Bash
    Steps: Run the same requests with a non-admin token and direct crafted endpoint/channel attempts.
    Expected: Responses exclude system data or return authorization failure; aggregate counts remain normal-user safe.
    Evidence: .sisyphus/evidence/task-5-admin-error.txt
  ```

  **Commit**: YES | Message: `fix(auth): enforce admin-only system telemetry access` | Files: [gateway/auth/metrics auth boundary code/tests]

- [ ] 6. Project darwin system telemetry into canonical read-models

  **What to do**: Extend the starlight metrics projector so darwin system telemetry maps into the same canonical read-model families used by the client: `catalog/services`, `catalog/services/summary`, `overview/summary`, `overview/trends`, `overview/risk-services`, `overview/incidents`, `overview/ingest-status`, `service/detail`, and `service/runtime`. Explicitly define how raw node-universe metrics map to platform metric keys like `service-count`, `error-rate`, and `p95-latency`.
  **Must NOT do**: Do not expose raw metric names to the client; do not merge system telemetry into non-admin aggregates.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Projection math, identity joins, and API compatibility.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Data/model task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [8,9,10] | Blocked By: [1,2,3,4]

  **References**:
  - Pattern: `StarLight/src/api/metrics.ts:32-80` - Read-model API surface consumed by client.
  - Pattern: `darwin-app/src/apps/starlight/metrics/actions/realtime.ts:705-919` - Existing overview/service detail action shapes.
  - Pattern: `StarLight/src/domains/overview/panelModel.ts` - Platform metric keys and widget contracts.
  - Pattern: `StarLight/src/domains/service/pages/ServiceCatalogPage.tsx:75-110` - Read-model fields currently expected by the UI.

  **Acceptance Criteria**:
  - [ ] Canonical read-models can include system telemetry when admin scope is requested, with unchanged response shape.
  - [ ] Platform metric keys and widget contracts remain stable.
  - [ ] Service detail drill-down works from overview → catalog → detail for darwin system services.

  **QA Scenarios**:
  ```
  Scenario: Admin overview/service read-models resolve correctly
    Tool: Bash
    Steps: Run integration tests for overview/catalog/detail/runtime endpoints with bridge-fed system telemetry.
    Expected: Read-model payloads match existing API shapes and include correct platform metric key values for admin scope.
    Evidence: .sisyphus/evidence/task-6-readmodel-happy.txt

  Scenario: Projection never leaks into normal-user aggregates
    Tool: Bash
    Steps: Query the same endpoints without admin scope and compare totals/lists.
    Expected: No system telemetry rows, totals, or IDs appear.
    Evidence: .sisyphus/evidence/task-6-readmodel-error.txt
  ```

  **Commit**: YES | Message: `feat(metrics): project darwin system telemetry into read models` | Files: [metrics projector/actions/tests]

- [ ] 7. Define websocket/live-ops policy for raw metrics versus read-model data

  **What to do**: Keep websocket `metrics` broadcasts as a live-ops/debug capability only, define who can subscribe, what event names are allowed, and how it relates to admin-only system telemetry. Decide whether raw metrics websocket access is admin-only, ops-only, or removed from general client use. Align channel authorization with the API authorization model.
  **Must NOT do**: Do not let websocket raw metrics become an undocumented side-door around read-model filtering.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Policy + implementation boundary with gateway.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Not a UI-design task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [12] | Blocked By: [4,5]

  **References**:
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:166-218` - Current websocket event bridge.
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:229-358` - Connection/auth/subscription lifecycle.

  **Acceptance Criteria**:
  - [ ] Raw metrics websocket access has an explicit authorization policy.
  - [ ] Client product flows do not depend on raw websocket metrics as data source of truth.
  - [ ] Non-admin subscriptions cannot receive darwin system telemetry events.

  **QA Scenarios**:
  ```
  Scenario: Authorized live-ops subscriber receives allowed events
    Tool: Bash
    Steps: Run websocket integration test using an authorized admin/ops token and subscribe to allowed channels.
    Expected: Allowed events arrive with documented format and no dependency on read-model correctness.
    Evidence: .sisyphus/evidence/task-7-ws-happy.txt

  Scenario: Unauthorized client cannot use websocket as side-door
    Tool: Bash
    Steps: Attempt subscription with non-admin token or no token to raw/system channels.
    Expected: Subscription is denied or receives zero system telemetry.
    Evidence: .sisyphus/evidence/task-7-ws-error.txt
  ```

  **Commit**: YES | Message: `fix(gateway): harden websocket telemetry policy` | Files: [gateway websocket auth/policy docs/tests]

- [ ] 8. Remove current mock/compat shortcuts from metrics service paths touched by system telemetry

  **What to do**: Replace any placeholder/mock service catalog, overview, or compat logic that would conflict with the new darwin system bridge. Where current methods synthesize service health/QPS/latency from registry randomness or compatibility fallbacks, move those paths onto projector-backed normalized data for admin scope. Keep existing non-admin behavior stable until projector-backed equivalents are ready.
  **Must NOT do**: Do not leave random/mock values on admin system views; do not break normal-user read-models during transition.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Migration off transitional backend behavior without regressions.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Backend migration task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10,11] | Blocked By: [4,5,6]

  **References**:
  - Pattern: `darwin-app/src/apps/starlight/metrics/index.ts:427-537` - Current mock-ish services/instances methods.
  - Pattern: `darwin-app/src/apps/starlight/metrics-compat/index.ts` - Existing compatibility surface to review.
  - Pattern: `darwin-app/src/core/gateway/index.ts:103-108` - Route remap into `metrics-compat`.

  **Acceptance Criteria**:
  - [ ] Admin system views no longer depend on mock/random compatibility data where projector-backed data should exist.
  - [ ] Non-admin compatibility paths remain stable during migration.
  - [ ] The transition path is documented with rollback strategy.

  **QA Scenarios**:
  ```
  Scenario: Admin system views use projector-backed values
    Tool: Bash
    Steps: Run API tests comparing admin system responses before/after bridge-backed migration.
    Expected: Responses are deterministic and derived from normalized telemetry, not random/mock generation.
    Evidence: .sisyphus/evidence/task-8-migration-happy.txt

  Scenario: Normal-user flow remains unchanged during migration
    Tool: Bash
    Steps: Run regression tests for existing AppKey ingest and normal-user overview/catalog paths.
    Expected: Existing tenant/user-facing behavior does not regress.
    Evidence: .sisyphus/evidence/task-8-migration-error.txt
  ```

  **Commit**: YES | Message: `refactor(metrics): replace transitional system telemetry shortcuts` | Files: [metrics/compat migration code/tests]

- [ ] 9. Introduce current-service onboarding matrix and remediation changes

  **What to do**: Apply the contract to every current darwin-app microservice already emitting metrics. For each service, document or implement the required remediation: event-name alignment, metadata completion, interval correction, label normalization, reserved identity registration, and bridge inclusion. Produce an onboarding matrix covering current services and the exact required deltas per service.
  **Must NOT do**: Do not treat future-service guidance as sufficient; current emitters must be brought into compliance.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Multi-service rollout coordination.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Platform rollout task.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [11,13] | Blocked By: [6]

  **References**:
  - Pattern: `darwin-app/src/core/gateway/index.ts`, `core/auth/index.ts`, `core/user/index.ts`, `core/file/index.ts` - Core-service baseline.
  - Pattern: `darwin-app/src/apps/starlight/metrics/index.ts`, `logs/index.ts`, `metrics-alerts/index.ts`, `subscription/index.ts`, `metrics-compat/index.ts` - App/service emitters found by repo search.

  **Acceptance Criteria**:
  - [ ] Every current emitter has a status: compliant / needs-change / migrated.
  - [ ] No current darwin-app emitter remains on an undocumented event name or ambiguous interval unit.
  - [ ] The matrix is included in the execution document/runbook.

  **QA Scenarios**:
  ```
  Scenario: All current emitters are covered
    Tool: Bash
    Steps: Search the repo for Event reporter usage and compare against the onboarding matrix.
    Expected: Every current emitting service appears in the matrix with remediation status.
    Evidence: .sisyphus/evidence/task-9-current-services.txt

  Scenario: Remediation closes known hazards
    Tool: Bash
    Steps: Validate event names and interval values in the current-service matrix against the frozen contract.
    Expected: No emitter remains unresolved on naming/unit/metadata rules.
    Evidence: .sisyphus/evidence/task-9-remediation.txt
  ```

  **Commit**: YES | Message: `docs(metrics): onboard current darwin microservices` | Files: [service matrix docs/config/contract updates]

- [ ] 10. Add admin-only client scope and dataset discovery using existing panel-first model

  **What to do**: Integrate the new admin-only system dataset into the StarLight client without changing the panel-first architecture. Add an explicit admin-only scope/preset/template for system telemetry, wire dataset discovery to server-authorized APIs, and keep widgets bound to platform metric keys/read-model datasets. Normal users must not see admin-only scopes, dataset IDs, or panels.
  **Must NOT do**: Do not expose raw node-universe metric names; do not implement an arbitrary query-builder UI.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Client UX integration within existing panel-first architecture.
  - Skills: [`frontend-design`] - To preserve coherent admin-only scope UX without altering core model.
  - Omitted: [`web-artifacts-builder`] - Not an artifact app.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [11,12] | Blocked By: [5,6,8]

  **References**:
  - Pattern: `StarLight/src/domains/overview/panelModel.ts` - Existing widget/platform-key model.
  - Pattern: `StarLight/src/domains/overview/pages/OverviewPage.tsx` - Current panel-first implementation.
  - Pattern: `StarLight/src/domains/service/pages/ServiceCatalogPage.tsx` - Service catalog admin scope integration target.
  - Pattern: `StarLight/src/api/metrics.ts:32-80` - Existing read-model API client wiring.

  **Acceptance Criteria**:
  - [ ] Admin users can explicitly switch to or open a darwin system scope/preset in the client.
  - [ ] Non-admin users cannot see, preload, or infer system dataset discovery options.
  - [ ] Existing panel-first widgets continue using platform metric keys and read-model APIs only.

  **QA Scenarios**:
  ```
  Scenario: Admin system scope works end-to-end
    Tool: Playwright
    Steps: Log in as admin, open `/home/overview`, switch to the admin-only system scope/preset, drill into catalog and service detail.
    Expected: System telemetry widgets render correctly and drill-down uses normalized APIs without exposing raw metric names.
    Evidence: .sisyphus/evidence/task-10-admin-ui.png

  Scenario: Non-admin user sees no system scope or leaked dataset identifiers
    Tool: Playwright
    Steps: Log in as non-admin, inspect overview/service pages and network calls.
    Expected: No admin-only scope/preset appears and network payloads exclude system dataset discovery entries.
    Evidence: .sisyphus/evidence/task-10-nonadmin-ui.png
  ```

  **Commit**: YES | Message: `feat(overview): add admin-only darwin system scope` | Files: [StarLight client overview/service API/UI/tests]

- [ ] 11. Add regression tests for auth boundary, projector idempotency, and tenant-flow preservation

  **What to do**: Add automated tests that lock the security and data-boundary requirements: non-admin exclusion, admin inclusion by explicit scope, duplicate/replayed Event idempotency, invalid version handling, current AppKey ingest preservation, and client dataset resolution. Include backend integration tests and targeted frontend/API tests where needed.
  **Must NOT do**: Do not rely on manual spot checks for admin leakage or projector replay safety.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Boundary and replay correctness across backend/frontend.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Testing task.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [13,14] | Blocked By: [8,9,10]

  **References**:
  - Pattern: `StarLight/src/domains/overview/__tests__/panelModel.test.ts` - Existing lightweight test placement style.
  - Pattern: darwin-app metrics/auth/gateway services touched above - Target test surfaces.

  **Acceptance Criteria**:
  - [ ] Automated tests prove non-admin users cannot access or infer darwin system telemetry.
  - [ ] Automated tests prove duplicate/replayed events do not double-count.
  - [ ] Automated tests prove normal AppKey ingest behavior remains unchanged.

  **QA Scenarios**:
  ```
  Scenario: Security and replay suite passes
    Tool: Bash
    Steps: Run repository-specific backend/frontend test commands covering bridge/auth/client resolution suites.
    Expected: All new boundary/regression tests pass.
    Evidence: .sisyphus/evidence/task-11-test-suite.txt

  Scenario: One test fails when boundary is intentionally broken
    Tool: Bash
    Steps: Validate the suite includes negative coverage for leaked system telemetry and duplicate replay.
    Expected: The suite contains explicit failing-path assertions, not only happy-path assertions.
    Evidence: .sisyphus/evidence/task-11-negative-coverage.txt
  ```

  **Commit**: YES | Message: `test(metrics): lock admin boundary and replay safety` | Files: [tests across darwin-app and StarLight]

- [ ] 12. Harden route/menu/channel discovery so admin-only capability is not cosmetic

  **What to do**: Audit and update StarLight route guards, menu/sidebar visibility, API discovery endpoints, and websocket channel discovery so admin-only system telemetry is gated consistently. Ensure cached state, persisted panels, and role changes fail closed.
  **Must NOT do**: Do not leave admin-only gating as “hidden button” or sidebar-only logic.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Cross-cutting UX/security consistency.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Policy and boundary consistency more than visual design.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [13] | Blocked By: [5,7,10]

  **References**:
  - Pattern: `StarLight/src/router/index.ts` - Route-level admin discovery/gating surface.
  - Pattern: `StarLight/src/layout/left/index.tsx` - Sidebar/menu visibility surface.
  - Pattern: `darwin-app/src/core/gateway/methods/index.ts:154-218` - websocket auth/discovery boundary.

  **Acceptance Criteria**:
  - [ ] Admin-only features are protected at route, data, and channel layers.
  - [ ] Logout/admin-demotion clears or invalidates admin-only cached state/panels.
  - [ ] Non-admin users cannot infer system telemetry from menus, IDs, discovery payloads, or stale cache.

  **QA Scenarios**:
  ```
  Scenario: Admin downgrade fails closed
    Tool: Playwright
    Steps: Log in as admin, open system scope, then simulate logout or role downgrade and revisit routes/pages.
    Expected: Admin-only routes, datasets, and cached panels become inaccessible immediately.
    Evidence: .sisyphus/evidence/task-12-role-downgrade.png

  Scenario: Non-admin cannot infer hidden capabilities
    Tool: Playwright
    Steps: Inspect sidebar, routes, API discovery payloads, and persisted client state as a non-admin user.
    Expected: No admin-only identifiers or scopes remain visible or loadable.
    Evidence: .sisyphus/evidence/task-12-discovery-audit.png
  ```

  **Commit**: YES | Message: `fix(client): harden admin-only telemetry discovery` | Files: [StarLight router/menu/cache/channel code/tests]

- [ ] 13. Create future-microservice onboarding template and enforcement checklist

  **What to do**: Write the reusable onboarding contract for any future darwin-app microservice: required Event reporter config, canonical event name, metadata block, reserved namespace rule, service identity registration path, label governance, projector compatibility, tests, and rollout checklist. Include an implementation template/snippet and explicit “no client changes required unless introducing a new platform metric key” guidance.
  **Must NOT do**: Do not leave future onboarding as tribal knowledge or per-service ad hoc adaptation.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Runbook/template quality matters for long-term consistency.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Documentation/runbook task.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [14] | Blocked By: [9,11,12]

  **References**:
  - Pattern: Current-service matrix from Task 9 - Reuse as onboarding template basis.
  - Pattern: `darwin-app/src/core/*/index.ts` - Existing service bootstrap examples.
  - Pattern: `node-universe/src/lib/metrics/reporters/event.ts` - Reporter semantics future services must follow.

  **Acceptance Criteria**:
  - [ ] A future darwin-app microservice can onboard by following the template alone.
  - [ ] The template includes required tests and rollout checks.
  - [ ] The template states exactly when a client change is and is not allowed.

  **QA Scenarios**:
  ```
  Scenario: Template is sufficient for a hypothetical new service
    Tool: Bash
    Steps: Walk a hypothetical `billing-worker` or `search-service` through the onboarding checklist using only the template.
    Expected: Every required integration step is covered with no unstated assumptions.
    Evidence: .sisyphus/evidence/task-13-template-walkthrough.txt

  Scenario: Template prevents unsupported variations
    Tool: Bash
    Steps: Compare the template against known bad variants: custom event names, missing metadata, raw client metric exposure.
    Expected: The checklist explicitly forbids those variations.
    Evidence: .sisyphus/evidence/task-13-template-errors.txt
  ```

  **Commit**: YES | Message: `docs(metrics): add future microservice onboarding template` | Files: [runbooks/templates/docs]

- [ ] 14. Produce rollout, migration, rollback, and operations runbook

  **What to do**: Define the rollout order across current services and environments, migration from current transitional/mock behaviors, monitoring/alerting for bridge health, dead-letter/quarantine handling, replay/backfill policy, rollback triggers, and success metrics. Include a zero-leak security verification checklist for release approval.
  **Must NOT do**: Do not ship without a rollback path or operational health criteria.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Final execution discipline and release safety.
  - Skills: `[]`
  - Omitted: [`frontend-design`] - Runbook task.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [Final Verification Wave] | Blocked By: [11,13]

  **References**:
  - Pattern: Current-service matrix and bridge/projector tasks above - Rollout basis.
  - Pattern: `darwin-app/src/apps/starlight/metrics/actions/ingest.ts` - Existing intake/quota/processing path to preserve.
  - Pattern: `StarLight/docs/refactor/implementation-status.md` - Existing status-documentation style to mirror.

  **Acceptance Criteria**:
  - [ ] The execution document contains phased rollout, rollback triggers, and health SLOs for the bridge/projector.
  - [ ] Release approval requires evidence that non-admin leakage is impossible across API/websocket/client discovery.
  - [ ] The runbook covers backfill/replay and malformed-event failure handling.

  **QA Scenarios**:
  ```
  Scenario: Rollout plan is executable end-to-end
    Tool: Bash
    Steps: Review the runbook against current-service inventory, environment sequence, and rollback actions.
    Expected: Every rollout step has an owner, precondition, verification, and rollback trigger.
    Evidence: .sisyphus/evidence/task-14-rollout.txt

  Scenario: Failure handling is operationally complete
    Tool: Bash
    Steps: Review the runbook for bridge outage, malformed event storm, duplicate replay, and admin leakage incidents.
    Expected: Each incident has explicit mitigation and rollback actions.
    Evidence: .sisyphus/evidence/task-14-ops-failures.txt
  ```

  **Commit**: YES | Message: `docs(metrics): add rollout and operations runbook` | Files: [execution doc/runbook]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit by layer, not by service count:
  1. Contract + types + normalization constants
  2. Metrics bridge/projector + tests
  3. Auth/gateway/admin visibility boundary + tests
  4. Client admin scope/panel integration + tests
  5. Docs/runbook/future-service onboarding template
- Commit messages must reflect intent, e.g. `feat(metrics): add darwin system telemetry bridge`.

## Success Criteria
- All existing darwin-app microservices can project into StarLight through one governed Event contract.
- Future darwin-app microservices can onboard by following the contract and metadata template alone.
- Admin users can explicitly access darwin-app system telemetry datasets; non-admin users cannot infer them from counts, lists, IDs, websocket channels, or cached state.
- Panel-first Overview remains stable and configurable without exposing raw node-universe metric names.
