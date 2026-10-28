# Business rules

This document owns the current numbered system invariants. [Domain operations and API contracts](api-contracts.md) explains their implementation boundaries; [Complete journey](journey.md) owns the end-to-end flow, milestone criteria and dated evidence. [AGENTS.md](../AGENTS.md) owns engineering instructions. Current rules override dated history; historical approvals never authorize new operations.

## Current system rules

Stable rule-group IDs identify the existing paragraphs below; they do not change their requirements. Keep IDs when editing or moving a rule, never reuse retired IDs, and allocate the next unused ID for new rules. Milestone IDs and dated history are retained in [Complete journey](journey.md). [Code ownership mapping](code-owners.md#11-business-rule-to-owner-index) links each rule group to its implementation or operational owner.

### Product and booking policy

<a id="br-001"></a>

**BR-001** — Customer booking website for one Singapore venue and one shared studio across instructors. Sessions are 40 minutes on 50-minute starts, 1–4 players, with multiple selected sessions permitted. Singapore time and SGD apply. Booking closes four hours before start: exactly 240 minutes is eligible; less is rejected in calendar filtering and server preparation/pre-write validation. Staff portals, memberships/packages, recurring charges, payroll and historical data migration are outside the commissioned website scope unless separately agreed.

<a id="br-002"></a>

**BR-002** — SimplyBook owns services, schedules, eligible instructors, customer/booking/invoice records and configured shared-studio capacity. Browser labels, prices, dates, IDs and cached availability are never write authority. The server validates identity, account, service, time, price and current operation scope. Direct checkout deliberately omits extra live catalogue/availability preflight; provider creation enforces availability and every creation response is validated. Capacity configuration does not prove batch atomicity.

### Identity, privacy and environment isolation

<a id="br-003"></a>

**BR-003** — Email proof precedes protected existing-customer lookup/prefill. Missing, duplicate or shared-email identities must not leak another customer's details. Guests use server-issued protected capabilities; browser storage/URLs are not credentials or ownership evidence. Turnstile, email challenge limits, expiry, signed/session authority and revocation remain enforced. Resend delivers verification codes; SimplyBook handles booking notifications on final payment in the accepted account configuration. These are separate email flows.

<a id="br-004"></a>

**BR-004** — D1 foundation identity must match the configured account, environment, database and coordinator. Missing/mismatched bindings fail closed; no automatic claim of an unknown database. Provider credentials remain Worker secrets. Returning contact profiles require explicit remember consent and current verified identity; sign-out revokes access without deleting retained contact evidence. All-device sign-out accepts any current server-verified email session, including remembered restoration, without a five-minute re-verification requirement; guest, expired and revoked authority cannot revoke identities. Identity proof remains memory-only for at most 30 seconds, bounded by token validity. Revalidate authorization for receipts/downloads and legacy recovery.

<a id="br-005"></a>

**BR-005** — Developer and client accounts, merchants, origins, mappings, secrets and data must stay isolated. Existing source still pins developer account/database/environment values, sandbox HitPay hosts, provider safety exclusions, sender settings and repository paths. Moving repositories is not yet configuration-only. Client portability must replace those pins with validated configuration, not remove account/host guards.

### Availability and selection

<a id="br-006"></a>

**BR-006** — Public display snapshots support fast browsing; they do not authorize bookings. Scheduled warming refreshes availability on its approximately 15-minute cadence through the minute scheduler; snapshots have a fixed maximum 30-minute display lifetime, never renewed by serving them. Protected selection rechecks current rules. On entry/refresh retain an available chosen day, otherwise choose the next available day in the loaded month (or its first available future day); failed/empty months keep an honest state. Do not silently scan other months or alter the basket. Review remains editable and creates no booking.

### Checkout, durable effects and customer errors

<a id="br-007"></a>

**BR-007** — Flow: calendar → Details → Review/consent → reserve attempt authority → create/validate all sessions → retain complete booking association → reserve payment effect → create/save HitPay request and URL → handoff. Single uses book; batch uses createBatch, sequential book calls and closeBatch. Each provider write requires durable claim/evidence first. Retain raw booking evidence and provider references before strict validation. Validate batch closure, membership, invoice/account, currency and total before any payment. No payment for an incomplete batch.

<a id="br-008"></a>

**BR-008** — Unknown write outcomes retain original attempt identity and evidence. Never blindly replay creation, invent success, delete uncertainty, renew grants/deadlines or automatically cancel unknown bookings. Repeated requests return protected saved results according to grant state; they do not create duplicate effects. A claimed grant does not alone prove a provider session exists.

<a id="br-009"></a>

**BR-009** — For explicit preparation-window rejection (including 409), bounded authenticated readback checks the original attempt/owned grant before fresh availability. Actual dispatch/effect/payment evidence retains recovery. Confirmed unavailable selection shows “This time slot is no longer available. Please choose another.” Inconclusive preparation failure shows “We couldn’t start checkout. Please try again later.” Keep explicit rejection on Review; do not show payment verification for a checkout that never started. Failed readback after an uncertain write preserves recovery.

### Payment, reconciliation and expiry

<a id="br-010"></a>

**BR-010** — HitPay hosts payment; secrets and payment verification stay server-side. Bind merchant, account, attempt, invoice, amount/currency and request identity before accepting evidence. Browser return and webhook payload alone never confirm a booking. Authenticate webhooks, retain/deduplicate receipts, and read authoritative provider state. Recovery preserves original financial claims and handles delayed/duplicate/out-of-order delivery without duplicate accounting.

<a id="br-011"></a>

**BR-011** — Original booking creation anchors the eight-minute payment window and fifteen-minute hold. The checking period is thirteen minutes; recovery buffer remains five minutes. These are different clocks. Browser expiry, deleted/expired payment links or exhausted polling do not prove settlement impossible. Protect unknown in-flight outcomes. After verified payment, reconcile SimplyBook accounting and require current valid-booking/paid-invoice readback before final confirmation. Preserve the first valid confirmation timestamp on later visits. Refunds are owner/provider operations; cancellation is not a refund.

<a id="br-012"></a>

**BR-012** — Polling: at most one check per two seconds for the first 20 checks, then at least ten seconds, with allowance 120 and the original checking deadline. An unresolved page refreshes on focus/foreground (coalesced, minimum 30 seconds) and once at the original server hold expiry; hidden pages catch up when visible. This does not restart polling or authorize expiry. Confirmed/denied pages stay terminal. Only authenticated server outcome permits release. Completed dismissal is repeatable; lost acknowledgement must not create a second attempt or erase uncertain evidence.

### Confirmation and presentation

<a id="br-013"></a>

**BR-013** — Show checking/preparation/payment-received states according to actual evidence. Payment received can remain booking pending until reconciliation is complete. Preserve customer details/reference during errors; expose confirmed actions only with authoritative confirmation. Sessions/instructors and total appear once in the summary; expanded details contain client and location side by side where space permits, then a full-width concise disclaimer. Receipt tax data is independent of summary presentation. PDF/calendar exports require current authorization and validated booking evidence; a saved browser snapshot cannot bypass it.

### Storage, queue and tokens

<a id="br-014"></a>

**BR-014** — D1 holds minimal access/attempt/grant/effect/payment/webhook/recovery evidence and display snapshots; it is not a replacement booking system. Apply additive compatible migrations, never rewrite accepted migration history or reset records to conceal failures. The account Durable Object owns serialized provider workflows and persistent SQLite coordination/token state.

<a id="br-015"></a>

**BR-015** — One active workflow; at most 24 waiting jobs with the last four reserved for recovery. Waiting jobs expire after 15 seconds before execution with 503 provider_queue_busy. Recovery gets the next turn, at most two consecutively while customer work waits; display gets a turn after four foreground jobs. FIFO within each priority. Cached display reads can bypass the queue. Physical provider concurrency is separately bounded to two; identified ended/expired transports may release capacity with audit evidence, but unknown financial effects remain fenced. Do not interpret slot release as authorization to replay a write.

<a id="br-016"></a>

**BR-016** — Two AES-GCM-encrypted account/environment/credential-scoped tokens persist in Durable Object SQLite, not D1. Public retention is 50 minutes, admin 60 seconds, with original absolute expiry unchanged by hits/restoration. Authentication rejection invalidates its own family and identity proof; late rejection of an old token cannot invalidate its replacement. Restoration never substitutes for current identity/booking/payment verification. Logs distinguish restoration, expiry, rejection and invalid records without token values. With `PUBLIC_TOKEN_REFRESH_AHEAD=enabled`, the existing serialized display-warming workflow replaces a still-valid public token when at most 20 minutes remain. It retires the old generation before authentication; replacement gets its own fixed 50-minute lifetime. A failed replacement leaves the old token retired, with no immediate retry. Empty/expired caches use normal demand authentication. Admin retention is unchanged. The closed configuration defaults off; the verified developer live-release profile enables it. This reduces miss frequency, not the duration of a genuine cold miss or a guarantee of uninterrupted availability.

<a id="br-017"></a>

**BR-017** — Successful single checkout and reconciliation each use five D1 round trips; batch checkout uses 2×sessions+7 (11/15/23 for 2/4/8), excluding coordinator SQLite. These are measured/source successful-path counts, not absolute minima or caps on failure/recovery. Overlapping provider/storage timings must not be summed as exclusive wall time.

### Observability and Grafana

<a id="br-018"></a>

**BR-018** — Existing sanitized Worker diagnostics and Server-Timing cover checkout, confirmation, provider queues/tokens and reconciliation. `provider_transport_timing` separates authentication/booking/HitPay creation into time to headers and subsequent body/parse time; these include network and provider processing, not isolated network RTT. `foundation_trace.d1Execution` reports available per-statement SQL timings and bounded serving-colo metadata, separate from total D1 call duration/count; missing metadata is not proof of zero execution time. Correlate HTTP/coordinator work by correlation ID and protected confirmation/recovery by hashed recovery key. Never export credentials, customer fields, raw URLs, SQL, arbitrary exceptions or booking/payment authority.

<a id="br-019"></a>

**BR-019** — Prepared Tail Worker `worker/telemetry.ts` converts allowlisted diagnostic summaries to OTLP/HTTP JSON for Grafana Cloud Tempo. It is disabled and unattached; no Grafana stack/ingestion acceptance yet. It runs after producer execution, outside customer request handling, with no provider/D1 calls. It does not fabricate parent-child continuity across RPC/alarms or represent aggregate durations as exact individual spans. Dashboard owner: `observability/grafana-dashboard.json`; configuration owner: `wrangler.telemetry.jsonc`.

<a id="br-020"></a>

**BR-020** — Defaults: 10% deterministic successful-correlation sampling; recognized failures bypass sampling within bounded limits. Maximum 32 Tail events, 256 log messages/event, 32 KiB accepted input strings, 128 spans and 512 KB outbound; five-second export timeout, 50 ms CPU, no redirects, persistent spool or retries. Failure retention is best effort. Activate only with secure endpoint/auth configuration and validate receiver ingestion, dashboard queries, correlation, redaction and overhead. Export HTTP success alone is not ingestion proof.

### Deployment, migration and acceptance

<a id="br-021"></a>

**BR-021** — Current main CI requires frontend, backend and live-email gates. The legacy main deployment remains in place until a reviewed switch to portable mode. The target scaffold adds separate manual staging and production workflows, distinct account credentials, exact-revision/target artifact verification and existing-resource preflight. Production uses an explicit manual workflow compatible with GitHub Free private repositories, not assumed paid environment protection. Client uploads remain closed; first upload may create only the configured Worker, after D1/Pages exist. It does not self-register foundation identity. Pending migrations are determined by D1's migration ledger, not a hardcoded developer migration/version checkpoint. The [development guide](development.md) owns configuration; the [runbook](runbook.md) owns operator steps. Automatic trusted PR staging, remote interrupted-install acceptance and client activation remain pending.

<a id="br-022"></a>

**BR-022** — Owner will create client accounts/resources first. Then prepare portable configuration, validate/reuse those resources, test first install/rerun/interruption/account mismatch in isolation, report results and integrate before pushing to client GitHub. Keep access disabled through preparation; validate client provider entitlements, service/instructor mappings, shared capacity, schedules, notification configuration, merchant/payment destination, domain/email verification and legacy receipt/recovery continuity before UAT/cutover. A credential swap or green CI alone is not production acceptance.

<a id="br-023"></a>

**BR-023** — Bounded synthetic load is accepted for 1/3/5 baseline/fault cohorts and separate ten-customer overload/retry profiles. Original ten-customer all-success failure remains evidence: eight admitted/two rejected. Admitted attempts recovered; explicit same-ID retries created unpaid payments without duplicates. CI runs only the 1/3 smoke matrix. Synthetic providers establish application invariants, not live provider limits or sustained capacity. Original roadmap 1/5/20 release workload remains separate.

<a id="br-024"></a>

**BR-024** — Owner accepts normal payment/recovery/dismissal, 15-minute timeout and the observed long-open confirmation remaining confirmed. Deployed logs prove public-token SQLite restoration outside memory; HAR08 measured one 4.87-second checkout including a 0.992-second token miss. HAR09 is identical and proves no fresh network read. Batch later-item rollback/failed closure and in-flight late settlement remain unproven owner-accepted risks. Keep financial policies unchanged. Remaining: client rollout/UAT, Grafana validation, and regression checks after UI/UX/email refinements; further warm/batch performance and sustained-capacity work are optional follow-ups, not blanket milestone closure.

### Client hosting setup (prepared, not deployed)

<a id="br-025"></a>

**BR-025** — The selected client topology is Cloudflare for SaaS on `soccerbotsg.win` (client account `0b36822648e6905c681a90b6bec5ca7f`) routing to `soccerbot-production` with Worker Static Assets. Primary owns the DNS test zone `standardsoftwares.com`. Begin with `https://booking.standardsoftwares.com`, then separately verify the test apex before claiming production apex support. Final origin is `https://soccerbotsg.com` with Uncoverin retaining DNS; vendor account access, proxy mode, CAA and validation requirements remain to be confirmed. `app404.ai` is excluded from the test.

<a id="br-026"></a>

**BR-026** — The SaaS fallback `fallback.soccerbotsg.win` is active. Deployment requires the declared zone in the selected account, active/unpaused status, an active matching fallback, its proxied originless `AAAA 100::` record, and no competing routes. The tested artifact declares the zone-scoped `*/*` route. All client requests run through the Worker before assets, so alternate origins are rejected. Worker previews and Workers.dev are disabled. The optional Pages entry remains available for separately configured targets; this client target does not create or require a Pages project. Production remains closed and the public Turnstile key is still missing.

<a id="br-027"></a>

**BR-027** — D1 resource identity and placement evidence are in the 27 October provisioning entry. Do not self-register its immutable foundation or initialize the coordinator without the selected placement hint. Deploy the verified application artifact, preserve developer staging identity/data, and record first-install, interrupted-install, safe-rerun and rollback acceptance. Provider secrets are unnecessary for closed domain proof; install client provider credentials only for separately accepted integration/UAT. Production origin changes require appropriate target re-verification, including build-time settings.

<a id="br-028"></a>

**BR-028** — The client repository will own both environments: trusted PR staging continues to the existing developer Cloudflare/SimplyBook/Resend/Turnstile and payment sandbox configuration, while production uses client resources. Current staging workflows remain manual/reserved; automatic trusted PR deployment is requested but not implemented. Deny forks and Dependabot deployment credentials and prevent competing repository deployment ownership. Grafana uses the owner company’s central account, with separately scoped ingestion credentials and environment/service labels; activation remains pending. Weekly Dependabot version-update configuration is prepared; alerts, security updates and licensed scanning capabilities remain separate checks.

### Client initial placement strategy (planned)

<a id="br-029"></a>

**BR-029** — Choose database and coordinator placement together before the client account Durable Object is first used:

1. Create the client D1 database with the `apac` location hint; inspect primary-query metadata (`served_by_primary` and `served_by_colo`) to establish its actual serving location. A hint is best effort, not a guaranteed city.
2. If the primary is in Japan, prefer the account DO hint `apac-ne`; if near Singapore, prefer `apac-se`. For another location, measure before selecting. Keep these environment-specific choices in validated configuration, not repository/account hardcoding. The configuration/provisioning automation is still future work.
3. Apply the chosen hint on the new account object's first creation/use. Leave frontend/entry Worker routing unchanged initially; Worker placement does not relocate the account DO. Do not rename or replace an existing object to move it without a separate plan preserving coordination, token and recovery state.
4. Verify the DO's actual execution with Cloudflare GraphQL `durableObjectsInvocationsAdaptiveGroups` or `durableObjectsPeriodicGroups`, grouped by `objectId` and `coloCode`; record namespace/object identity and observation window. Incoming `request.cf.colo`, provider response edges and the requested hint are not execution-location proof. Missing analytics is inconclusive.
5. Validate owner-operated checkout end to end, including provider timings, D1 round trips, queue waits and failures. Nearby D1 is an initial candidate-selection rule, not proof of the globally fastest placement or a 2–3-second checkout.

<a id="br-030"></a>

**BR-030** — This is a client setup strategy, not a deployed setting or authorization to provision/migrate resources. Existing developer placement evidence and its limits are retained in Part 2.

### Checkout placement experiment — waived

<a id="br-031"></a>

**BR-031** — Owner waived the separate real-checkout placement comparison on 22 October 2026. Do not prepare/deploy its two variants, cold-token reset control or quiet-window procedure as outstanding work. No resources were created for that comparison. Retain the completed bounded read-only screening and actual location evidence in Part 2; waiver is not a measured speedup or a latency acceptance pass.

<a id="br-032"></a>

**BR-032** — Follow the client initial placement strategy above: verify the new D1 primary location, prefer `apac-ne` when it is in Japan, then verify actual DO execution and checkout during normal client UAT. Reduced database network time is an engineering expectation; end-to-end savings and a 2–3-second cold checkout remain unproven. Existing developer coordinator placement is unchanged. The earlier preparation protocol is retained in Git history, not an active execution instruction.
