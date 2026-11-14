# Architecture decision records

Recorded: 28 October 2026. These records explain the current stack and its tradeoffs. **Status distinguishes implemented choices from prepared or proposed choices.** Rationale is reconstructed from the current code, constraints and [recorded contracts](../business-rules.md); it is not a claim that every alternative was previously benchmarked or formally rejected. Alternatives below are contingency options for review, not authorised migrations or ready standby systems.

[System topology](diagram.md) shows the components; [database schema](database-schema.md) maps tables and relationships; [code owners](../code-owners/index.md) maps implementation; [runbook](../runbook.md) owns operational recovery. Business rules remain in the business-rules document. Version pins belong to [versions.md](../versions.md), not this document. Amend a decision explicitly or add a superseding ADR when its assumptions change; preserve the rationale and evidence for the prior choice.

## Context and decision drivers

The product serves a Singapore studio with shared capacity across instructors. It needs fast calendar browsing, protected email identity, reliable single/multiple-session booking and a hosted payment journey. SimplyBook remains the booking/invoice authority; HitPay remains the payment authority. Network timeouts cannot be treated as proof that a financial effect did not happen. The client must own production resources. The owner now intends to transfer the registrar first and then move authoritative DNS to the client Cloudflare account; the prior vendor-retained DNS constraint is superseded as the target ownership plan.

The design therefore prioritises correctness under retries, separation of provider authority, modest operational overhead, explicit environment isolation, traceable releases and a maintainable handover. This is not a claim of unlimited throughput, lowest possible cost or a guaranteed checkout latency. Current provider and platform entitlements, limits and prices must be rechecked before a capacity or migration decision.

## Decision summary

| ID      | Choice                                                          | Status                                                                        | Main benefit                                                         | Main tradeoff                                                      |
| ------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ADR-001 | React/TypeScript with Next.js static export                     | Implemented                                                                   | Rich UI delivered as static assets; server authority stays explicit  | No per-request Next.js server features in this deployment          |
| ADR-002 | Cloudflare Worker and Worker Static Assets                      | Implemented developer hosting; client rollout pending                         | Same-origin assets/API with managed edge execution                   | Runtime/platform constraints and regional provider latency remain  |
| ADR-003 | Account Durable Object plus D1 and DO SQLite                    | Implemented                                                                   | Serialized provider work and durable evidence for uncertain outcomes | Account-level bottleneck and stateful migration complexity         |
| ADR-004 | SimplyBook scheduling plus HitPay hosted payment                | Implemented integration, current payment sandbox; client live mapping pending | Reuse specialist provider capabilities and staff operations          | Cross-provider consistency and external API dependence             |
| ADR-005 | Email proof with Resend, Turnstile and server-side access state | Implemented feature; client configuration pending                             | Protect saved details without a custom password account system       | Email delivery, bot challenge and revocation lifecycle complexity  |
| ADR-006 | Sanitized diagnostics to central Grafana Tempo                  | Producer diagnostics implemented; exporter activation pending                 | Correlated troubleshooting outside the request path                  | Sampling gaps and incomplete production service separation         |
| ADR-007 | GitHub PR verification and exact-artifact deployment            | Implemented developer path; portable cutover pending                          | Traceable revisions, strict checks and reproducible release evidence | CI cost/time, dependency coordination and manual operational steps |
| ADR-008 | Cloudflare for SaaS for vendor-managed customer DNS             | Prepared earlier; ownership assumption superseded; reassessment pending       | Separate DNS ownership from client hosting with managed TLS          | Prerequisite, apex and renewal proof required before rollout       |

## ADR-001 — React/TypeScript and Next.js static export

**Decision.** Build the customer interface in React/TypeScript with Next.js static export. Use shared domain definitions and validated service adapters; serve the exported assets rather than running a Next.js application server. GitHub Pages serves a separate demo build.

**Why it fits.** The site needs interactive calendar, multi-step forms and payment-return state more than per-request server rendering. Static output keeps frontend delivery independent from provider requests and leaves secrets and booking/payment authority in the Worker. TypeScript and runtime validation help keep browser/Worker contracts aligned; compile-time types alone cannot validate external provider data.

**Pros.** Existing route/component structure is reusable; static delivery is cacheable; public pages do not need a dedicated app server; feature and domain tests can target clear boundaries.

**Cons.** Static-export constraints rule out relying on server actions, request-time Next.js rendering or server image optimisation in this deployment. Build-time origin/sitekey/profile changes require the correct rebuild and verification. Hydration, client state and bundle size still need attention. Next.js remains an upgrade/security-maintenance responsibility even when some server advisories do not apply to deployed paths.

**Scaling / revisit trigger.** Measure bundle and interaction costs, then optimise actual UI bottlenecks. Reconsider server rendering only if concrete content/personalisation requirements cannot be met by the static/API split. More static traffic does not by itself justify replacing the framework.

**Alternative / contingency.** React with Vite could simplify a static-only frontend, but requires route/build/export/test adaptation. A hosted Next.js server could support dynamic rendering but introduces an additional runtime, secrets and deployment surface. Neither can replace the backend authority checks. A cached static page is not a failover booking engine.

**Owners/evidence.** [App routes](../../src/app), [service composition](../../src/services/index.ts), [Next config](../../next.config.ts), [export checks](../../scripts/check-export.mjs), [BR-003](../business-rules.md#br-003), [BR-007](../business-rules.md#br-007).

## ADR-002 — Cloudflare Worker with Static Assets

**Decision.** Use a Cloudflare Worker for protected HTTP APIs and Worker Static Assets for the customer frontend, keeping API and site on the intended origin. Validate environment/foundation and request authority at the backend. The optional Pages adapter remains available for appropriately configured targets.

**Why it fits.** Managed execution avoids operating a conventional application server and integrates with D1 and Durable Objects. Same-origin delivery reduces separate frontend/API origin and cookie configuration. Worker-first routing on the prepared client target allows canonical-origin checks before assets are served.

**Pros.** Managed routing/TLS infrastructure, integrated platform bindings and a single deployable application entry. Static assets and protected API logic have a clear boundary. The application can enforce closed access during incomplete client setup.

**Cons.** Workers is not an unrestricted Node server; APIs, CPU/runtime limits and platform behavior constrain libraries and long-running work. Edge entry does not imply low latency to a regional provider or a particular DO/D1 location. A Cloudflare incident can affect multiple components at once. Same-origin hosting does not remove the need for cookie, origin and authorization checks.

**Scaling / revisit trigger.** Measure request volume, CPU, provider timings and stateful bottlenecks separately. Review account limits/plan when observed demand requires it. Do not infer backend capacity from fast asset delivery. Evaluate placement from actual D1/DO evidence; moving Worker entry alone does not move the coordinator.

**Alternative / contingency.** A regional container/Node service on AWS or another host could offer more runtime control and proximity to providers, at the cost of routing, scaling, patching and persistence operations. Moving the Worker API requires porting bindings, secret handling, cookies, scheduled work and state consistency—not merely changing a DNS target. The existing demo Pages site cannot transparently replace live checkout during an outage.

**Owners/evidence.** [Worker entry](../../worker/index.ts), [bindings](../../worker/bindings.ts), [Worker config](../../wrangler.jsonc), [Pages adapter](../../worker/pages.ts), [BR-004](../business-rules.md#br-004), [BR-029](../business-rules.md#br-029).

## ADR-003 — Account coordinator, D1 journal and DO SQLite

**Decision.** Serialize account-level provider workflows in a Durable Object. Store durable access/attempt/grant/effect/payment/recovery evidence and display snapshots in D1; use the DO’s own SQLite for coordination and encrypted provider-token state. These are distinct stores, not replicas of one database.

**Why it fits.** One shared studio and provider account need predictable admission, provider limits and recovery priority. Durable claims before external writes prevent a retried browser request from becoming an untracked duplicate effect. Persistent encrypted token restoration reduces repeated authentication without extending the token’s original expiry. D1 records application evidence; it does not replace the provider booking ledger.

**Pros.** Explicit serialization and effect fencing simplify reasoning about competing requests. Recovery can read retained associations after interruption. Bounded priority queues reserve capacity for reconciliation. Data and provider authority remain separated.

**Cons.** One account coordinator limits per-account throughput; horizontal Worker scaling does not remove that queue. Cross-system writes are not one distributed transaction. D1 round trips and provider latency remain visible. State identity, schema evolution and recovery-point consistency complicate migration/restore. Token encryption requires correct account/environment/credential scoping.

**Scaling / revisit trigger.** Measure queue waits, admitted/rejected work, provider latency, D1 cost and single/batch mix. Use bounded cached reads where permitted; preserve priority and effect claims. Multiple independent venues/accounts could be partitioned by a proven business boundary, but the current single-account design is not already multi-tenant. Never split the same scarce studio capacity across independent writers without shared coordination and provider protection.

**Alternative / contingency.** PostgreSQL with transactional claims and a queue/worker service is a plausible redesign; a managed queue alone does not prevent duplicate external effects. Redis-style locks without durable effects are insufficient. Any migration must preserve attempt IDs, leases/fences, booking/payment references and scheduled reconciliation, and prevent old/new writers from operating concurrently. Recreating/renaming the current DO is not a safe relocation or restore shortcut.

**Owners/evidence.** [Coordinator](../../worker/coordinator.ts), [queue](../../worker/provider-queue.ts), [journal](../../worker/journal.ts), [payment journal](../../worker/hitpay-journal.ts), [token cache](../../worker/provider-token-cache.ts), [migrations](../../migrations), [BR-014–017](../business-rules.md#br-014).

## ADR-004 — SimplyBook and HitPay hosted payment

**Decision.** SimplyBook owns schedules, eligible instructors, shared resources, bookings and invoices. Multiple eligible trainers can share a start; the customer chooses a trainer independently for each slot. These are alternatives for one shared studio, not separate capacity. Keep trainer identity in the immutable booking intent and provider readback; never infer studio exclusivity merely from serialized requests or non-overlapping trainer schedules. HitPay hosts payment and owns payment truth. The backend creates/validates all required sessions and their association before creating the permitted hosted payment request. Webhooks and return navigation trigger authoritative reconciliation rather than directly marking the booking confirmed.

**Why it fits.** Reusing scheduling/admin and hosted-payment services avoids implementing a new scheduling back office or card-entry system. Admins and trainers can use SimplyBook for configured staff operations while customers use the custom frontend. Hosted payment keeps payment credentials out of the application; it does not remove all merchant/compliance responsibilities.

**Pros.** Existing staff scheduling and merchant workflows; a tailored customer journey without replacing provider ledgers; explicit readback and retained references support investigation.

**Cons.** Provider availability, latency, quotas, plan features and API changes are external dependencies. Shared capacity must be configured correctly. Multi-session writes and payment/accounting changes can partially succeed; no cross-provider atomicity is assumed. Browser return, expired checkout or callback delivery can all be misleading without authoritative evidence. SimplyBook cancellation and HitPay refund are separate operations.

**Scaling / revisit trigger.** Validate actual provider account capacity, scheduling/resource semantics and batch behavior before increasing throughput. Reconcile uncertain effects using original IDs. Consider a replacement provider only when required capabilities, cost, reliability or measured limits justify the migration—not simply because a different API looks easier.

**Alternative / contingency.** Another scheduling SaaS or a custom scheduling service would require migration of calendars, capacity, staff permissions, customers, bookings and invoice history. Another hosted payment provider requires new adapters, merchant onboarding, callback validation and accounting acceptance. Keep legacy pending/refund cases reconcilable during a provider transition. There is no implemented hot-swappable fallback provider; operator-assisted resolution is preferable to silently issuing a second charge through another service.

**Owners/evidence.** [Native checkout](../../worker/native-checkout.ts), [provider transport](../../worker/provider-transport.ts), [provider normalization](../../worker/provider-normalization.ts), [HitPay recovery](../../worker/hitpay-recovery.ts), [BR-002](../business-rules.md#br-002), [BR-007–013](../business-rules.md#br-007). Client live merchant/mappings and owner acceptance remain separate from sandbox/CI evidence.

## ADR-005 — Email proof, Turnstile and server-side access state

**Decision.** Use an email challenge delivered through Resend, bot proof through Turnstile, and server-issued access/remembered-identity state. Require current email proof before protected saved-contact lookup. Keep booking notifications with SimplyBook rather than merging them into identity email delivery.

**Why it fits.** The customer journey needs guest access and quick returning-customer prefill without a separate password-account product. Server-side revocation and identity checks prevent browser storage or a stale remembered session from becoming authority.

**Pros.** Clear ownership of authentication versus booking notifications; bounded challenge/consent/revocation behavior; fewer customer password-management screens; independent provider credentials stay server-side.

**Cons.** Deliverability and mailbox access affect login; challenges add friction and can be blocked or expire. Remember-me consent, identity replacement and all-device sign-out require careful lifecycle handling. Bot proof is not proof of identity and cannot replace rate limits. Email accounts are not a comprehensive staff identity/IAM solution.

**Scaling / revisit trigger.** Monitor actual delivery issues, challenge demand and abuse without exporting personal data. Maintain sender authentication and rate limits. Consider a dedicated identity provider if the business needs stronger customer authentication, federation or broader account administration; staff permissions remain provider-specific today.

**Alternative / contingency.** A replacement transactional-email provider needs a reviewed delivery adapter, sender-domain authentication and challenge/idempotency acceptance. An identity platform introduces account migration and recovery semantics. Mail-provider failure should produce a clear recoverable flow; never bypass email proof or switch recipients to preserve conversion. Existing sessions remain governed by their current validity, not an outage exception.

**Owners/evidence.** [Identity](../../worker/identity.ts), [delivery](../../worker/identity-delivery.ts), [remembered identity](../../worker/remembered-identity.ts), [access](../../worker/access.ts), [BR-003](../business-rules.md#br-003).

## ADR-006 — Sanitized diagnostics and central Grafana Tempo

**Decision.** Emit bounded diagnostic summaries in the Worker and prepare a separate Tail Worker to export allowlisted OTLP traces to the owner company’s Grafana. Keep export outside the customer request path and omit credentials, customer details and raw provider payloads.

**Why it fits.** Checkout spans multiple HTTP/coordinator/provider/recovery boundaries; correlation is more useful than isolated unstructured logs. A central monitoring account can serve multiple client environments while access and labels remain separated. Reconstructing safe summaries limits accidental data exposure and export volume.

**Pros.** Phase, queue, token and D1 timing evidence supports targeted diagnosis. OTLP gives a standard receiver interface. The separate exporter can fail without becoming a blocking checkout dependency.

**Cons.** Sampling and bounded payloads lose observations; there is no durable spool/replay. Summaries are not exact auto-instrumented call trees, total-traffic metrics or financial ledgers. TraceQL metrics support is needed. Current exporter/dashboard hardcode `soccerbot-dev` and do not yet implement configurable production environment/service separation; export is disabled and receiver/alert acceptance remains pending.

**Scaling / revisit trigger.** Measure exporter cost, ingestion volume, missing evidence and incident utility. Set retention and alerts deliberately. Add authoritative traffic metrics/availability checks where sampled traces cannot answer a question. Production mapping must be implemented and tested before activation rather than enabled by reusing developer labels.

**Alternative / contingency.** Cloudflare-native diagnostics can support interim investigation within available retention/access. Another OTLP backend or a self-hosted collector may be viable with endpoint/auth/exporter changes and operational cost. The current endpoint allowlist does not support arbitrary receivers without code review. Logs absent from the export cannot be recovered by changing dashboards after the fact.

**Owners/evidence.** [Diagnostics](../../worker/diagnostics.ts), [exporter](../../worker/telemetry.ts), [dashboard](../../observability/grafana-dashboard.json), [runbook signal dictionary](../runbook.md#4-monitoring-and-observability), [BR-018–020](../business-rules.md#br-018).

## ADR-007 — Verified revisions and immutable release artifacts

**Decision.** Use GitHub task branches/PRs, final-head frontend/backend/live-email gates and fresh main verification. Deploy the tested artifact instead of rebuilding after approval. Keep target identity and bindings explicit; production uses manual dispatch compatible with GitHub Free private-repository constraints. Maintain pinned dependencies/Actions and scheduled/security update review.

**Why it fits.** A release needs a clear connection between reviewed source, environment configuration, test evidence and deployed bytes. Separate environments prevent developer credentials/defaults from silently becoming client production configuration. Completed target verification triggers trusted-main deployment controllers; manual dispatch remains an operator fallback and does not require paid approval features.

**Browser execution boundary.** Build each root release composition once, distribute its exact bytes to two runner shards, then aggregate all 42 disjoint batches before packaging. Fresh Playwright processes limit each batch to one or two complete cases without splitting in-test reload, multi-tab or recovery scenarios. Aggregate gates require all device/case identities exactly once plus matching source, configuration, export, run and attempt. Frontend's separate project-path build retains complete verification with the same bounded process lifetime. The mitigation targets observed browser-lifetime disk growth; its precise upstream allocation cause remains unresolved and CI resource measurements must establish effectiveness.

**Pros.** Auditable provenance and account mismatch rejection; independent browser/Worker coverage; preserved failure receipts; reproducible dependency inventory and reviewed change history.

**Cons.** Multiple gates cost time and runner capacity. Platform/toolchain updates can require coordinated source, image and policy changes. Configuration-specific frontend builds may require separate artifacts from the same revision. Manual dispatch is not independent two-person approval. Artifacts expire unless deliberately retained, and a green synthetic test does not establish provider acceptance.

**Scaling / revisit trigger.** Improve test partitioning/caching only with evidence and intact coverage. Expand repository/environment ownership after proving the client cutover and avoiding duplicate deployers. Consider stronger approval controls if team/risk requirements grow. Automatic client PR staging and merged-main production triggers are implemented with independent target gates and trusted-main controllers. Untrusted forks/Dependabot cannot deploy or receive secrets; external cutover acceptance remains separate.

**Alternative / contingency.** Another CI system or self-hosted runners must preserve revision checks, isolation, test outcomes and artifact integrity. CI unavailability is not justification for an unverified local deployment. Normal rollback is a reviewed revert with fresh checks where schema-compatible; prior-artifact emergency restoration requires an approved rehearsed procedure. Neither reverses provider effects or database history.

**Owners/evidence.** [Workflows](../../.github/workflows), [release packaging](../../scripts/prepare-developer-release.mjs), [target provenance](../../scripts/verified-target-run.mjs), [deployment](../../scripts/deploy-cloudflare.mjs), [BR-021](../business-rules.md#br-021), [development guide](../development.md).

## ADR-008 — Managed custom hostnames with vendor-controlled DNS

**Status — amended 28 October 2026.** The original decision prepared Cloudflare for SaaS on client-owned `soccerbotsg.win` because Uncoverin was to retain customer DNS. The owner subsequently chose to transfer `soccerbotsg.com` to the client registrar first, then use client-managed Cloudflare DNS. That ownership assumption is superseded; the prepared implementation remains in the repository until a separately reviewed configuration change replaces or revalidates it. Transfer and DNS delegation have not been verified complete.

**Historical direction — 30 October 2026.** Bootstrap the closed client Worker on its verified Workers.dev hostname using existing D1, original coordinator identity and `apac-ne` first-use hint. Attach the client domain later through reviewed same-account routing and a newly verified target artifact. Do not assume a registrar transfer automatically changes nameservers or copies DNS records. Preserve the existing authoritative DNS and all email records during transfer; plan the nameserver/DNSSEC transition separately. Direct apex hosting, canonical redirects, same-origin API, secure cookies, managed issuance/renewal and rollback remain acceptance requirements.

**Why reconsider.** With client-controlled DNS and hosting, the original separation requirement may no longer justify a SaaS zone, fallback origin and custom-hostname validation chain. This is a reason to simplify after inspection, not proof that current SaaS preflight can be bypassed.

**Pros / cons of the current direction.** Consolidated client control can reduce vendor coordination and hosting indirection. It also makes DNS inventory, email continuity, account security, billing and migration/rollback the client’s responsibility. Supported routing, current plan prerequisites and costs still need verification before provisioning.

**Retained alternative.** SaaS remains a candidate if authoritative DNS stays in another account or ownership plans change. Its zone/fallback/proxy/CAA, persistent validation, pricing and apex prerequisites must be proven. Ordinary Pages apex hosting still has its account/zone requirements; flattening alone does not bypass them. Successful issuance does not prove actual renewal, and a subdomain redirect is not equivalent to serving the apex directly.

**Scaling / revisit trigger.** Revisit custom-hostname hosting if additional independently managed customer domains are introduced. Current canonical-origin checks do not implement a general multi-tenant router. Keep the existing production DNS baseline until the replacement is accepted; do not introduce recurring manual certificates.

**Owners/evidence.** [Production target](../../deployment/production.json), [deployment preflight](../../scripts/deploy-cloudflare.mjs), [hosting rules](../business-rules.md#client-hosting-setup-prepared-not-deployed), [DNS runbook](../runbook.md#8-domain-dns-and-https).

## Scaling review and fallback readiness

| Pressure or failure         | First evidence to collect                                             | Candidate response                                                                   | Preserve before changing architecture                                      |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| More page visitors          | Asset/frontend timings and request volume                             | Optimise actual bundles/cache behavior; check platform plan                          | API authorization and environment-specific build settings                  |
| Checkout queue saturation   | Wait/rejection rate, provider latency, cold/warm and single/batch mix | Address measured bottleneck; review provider capacity and bounded admission          | One scarce-resource authority, recovery priority and claimed-effect fences |
| More venues/accounts        | Independence of capacity, provider quotas and identity scopes         | Design explicit tenant/account partitioning                                          | Tenant isolation, global/shared constraints and old in-flight attempts     |
| D1 latency or size pressure | SQL versus call latency, query patterns, volume and retention needs   | Review queries/limits/placement; evaluate data-store migration if justified          | Foundation, compatible migrations and replay-safe journals                 |
| Provider outage             | Authoritative retained state and upstream status                      | Recover/hold affected attempts and operator escalation                               | Original references; no fallback double booking/charge                     |
| Cloudflare outage           | Impact across assets, API and state; provider financial effects       | Approved continuity plan; prepare alternative infrastructure only after state design | Consistent restore points and single active writer                         |
| Telemetry outage            | Producer/exporter/receiver evidence                                   | Restore visibility or use available platform diagnostics                             | Privacy controls; no assumption of historical replay                       |
| CI/service disruption       | Last verified artifact, revision and schema compatibility             | Restore delivery service or approved recovery procedure                              | No rebuilding/merging around verification safeguards                       |

No alternate stack in this document is deployed as hot standby. Before treating one as a backup, define ownership, current pricing/limits, RPO/RTO, data/export format, restore method, secrets/DNS transition, old/new writer fencing, in-flight payment reconciliation and a rehearsed acceptance/rollback plan. A source ZIP, static mirror or provider export alone is not a complete recoverable system.

### Closed-install registration control path — 30 October 2026

Use a named internal `FoundationManagement` Worker entrypoint for operator-only identity inspection, insert-only registration and separate coordinator initialization. The operator client accesses it through an authenticated remote service binding and validates the deployed resource mapping against the sealed production artifact. This avoids a public bootstrap endpoint or a local namespace-derived identity. Existing D1, coordinator namespace/name and provider boundaries remain unchanged; no separately deployed management Worker is required. Service-binding authority is privileged and must not be granted to untrusted callers. Historical setup/identity evidence is retained in Journey; current production release health is recorded in Progress. Operation success cannot substitute for actual placement or provider acceptance.

**ADR-008 implementation update —13 November2026.** Owner authorized immediate sandbox presentation at `soccerbotsg.com`. The zone is active in the same account as the existing Worker; native Custom Domains remove the need for the prepared SaaS chain. Runtime APP_ORIGIN and domain binding changed without code/data replacement; existing mail records remain intact. The owner updated the HitPay sandbox webhook. Native deployment configuration reconciliation remains local and must precede the next remote release; owner subsequently accepted new-domain access and a full payment through confirmation; canonical www handling remains separate from apex acceptance.
