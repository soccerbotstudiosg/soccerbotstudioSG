# Business rules

This document owns the current numbered system invariants. [Domain operations and API contracts](api-contracts.md) explains their implementation boundaries; [Complete journey](journey.md) owns the end-to-end flow, milestone criteria and dated evidence. [AGENTS.md](../AGENTS.md) owns engineering instructions. Current rules override dated history; historical approvals never authorize new operations.

## Status and evidence boundaries

Status reconciled on 28 October 2026 against this working revision, committed target/workflow files and the retained owner/provisioning records. This is not a fresh live-account audit. Requirements below remain authoritative regardless of a deployment checkpoint; [Progress](../PROGRESS.md) owns the latest PR/CI/handover status.

| Area                | Established evidence                                                                                                                                                                                                          | Still requires acceptance                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Portable hosting    | Target validation, manual deployment workflows and SaaS Worker entry exist in source; production target selects Worker Static Assets, not Pages                                                                               | Client exact-artifact installation, safe rerun/interruption/rollback and activation                                                     |
| Client placement    | D1 creation/KIX probe is recorded in [Journey](journey.md#27-october-2026--client-d1-created-and-primary-placement-verified); production target selects `apac-ne`; shared `coordinatorStub` applies/validates hints in source | First-use actual DO execution location and owner checkout evidence; do not create a second D1 or unhinted object merely to repeat setup |
| Dependency security | Weekly Dependabot and blocking npm audit are implemented; owner confirmed developer-repository graph/alerts/security updates                                                                                                  | Fresh advisory status, client repository settings and supported optional code/secret scanning; copied YAML does not enable settings     |
| Monitoring          | Sanitized diagnostics and exporter/dashboard source exist; committed exporter configuration is disabled                                                                                                                       | Actual stack/service mapping, exporter activation, alert receivers and ingestion/alert delivery                                         |
| Client integrations | Guarded developer integration exists; production configuration remains closed/incomplete in committed targets                                                                                                                 | Client sender/Turnstile/merchant/provider mappings, billing/MFA, DNS apex/renewal proof and UAT                                         |

## Current system rules

Stable rule-group IDs identify the existing paragraphs below; they do not change their requirements. Keep IDs when editing or moving a rule, never reuse retired IDs, and allocate the next unused ID for new rules. Milestone IDs and dated history are retained in [Complete journey](journey.md). [Code ownership mapping](code-owners/index.md#11-business-rule-to-owner-index) links each rule group to its implementation or operational owner.

### Product and booking policy

<a id="br-001"></a>

**BR-001** — Customer booking website for one Singapore venue and one shared studio across instructors. Sessions are 40 minutes on 50-minute starts, 1–4 players, with multiple selected sessions permitted. After choosing a time, the customer explicitly chooses an eligible trainer from that slot’s dropdown; each session has its own independent choice. Changing trainer replaces that slot’s selection, never adds another simultaneous session. Below the booking summary, stack one trainer card per stable instructor ID and list all dates/times chosen for that trainer. Singapore time and SGD apply. Booking closes four hours before start: exactly 240 minutes is eligible; less is rejected in calendar filtering and server preparation/pre-write validation. Staff portals, memberships/packages, recurring charges, payroll and historical data migration are outside the commissioned website scope unless separately agreed.

<a id="br-002"></a>

**BR-002** — SimplyBook owns services, schedules, eligible instructors, customer/booking/invoice records and configured shared-studio capacity. Browser labels, prices, dates, IDs and cached availability are never write authority. The server validates identity, account, service, time, price and current operation scope. Direct checkout deliberately omits extra live catalogue/availability preflight; provider creation enforces availability and every creation response is validated. Capacity configuration does not prove batch atomicity.

Owner-confirmed rule (31 October 2026): both staging and client production allow only one simultaneous booking across the SimplyBook account, across all trainers/services, including the changeover buffer. Admins have no exemption. Trainer weekly availability remains off; approved date-specific entries define working availability. Provider settings confirmation and controlled enforcement acceptance are separate evidence.

### Identity, privacy and environment isolation

<a id="br-003"></a>

**BR-003** — Email proof precedes protected existing-customer lookup/prefill. Missing, duplicate or shared-email identities must not leak another customer's details. Guests use server-issued protected capabilities; browser storage/URLs are not credentials or ownership evidence. Turnstile, email challenge limits, expiry, signed/session authority and revocation remain enforced. Resend delivers verification codes; SimplyBook handles booking notifications on final payment in the accepted account configuration. These are separate email flows.

<a id="br-004"></a>

**BR-004** — D1 foundation identity must match the configured account, environment, database and coordinator. Protected operations fail closed on missing/mismatched bindings; no automatic claim of an unknown database. The read-only health endpoint may report `foundationRegistration: pending` for a fully disabled production installation with an existing empty foundation table; this never grants customer authority or performs registration. Foreign registration and unreadable/missing schema remain failures. Provider credentials remain Worker secrets. Returning contact profiles require explicit remember consent and current verified identity; sign-out revokes access without deleting retained contact evidence. All-device sign-out accepts any current server-verified email session, including remembered restoration, without a five-minute re-verification requirement; guest, expired and revoked authority cannot revoke identities. Identity proof remains memory-only for at most 30 seconds, bounded by token validity. Revalidate authorization for receipts/downloads and legacy recovery.

<a id="br-005"></a>

**BR-005** — Developer and client accounts, merchants, origins, mappings, secrets and data must stay isolated. Portable target validation and account/resource preflight exist, but developer-specific identity delivery, sandbox HitPay hosts and provider safety scopes still require deliberate client configuration work. Moving repositories alone does not establish production portability. Client portability must replace those pins with validated configuration, not remove account/host guards.

### Availability and selection

<a id="br-006"></a>

**BR-006** — Public display snapshots support fast browsing; they do not authorize bookings. Scheduled warming refreshes availability on its approximately 15-minute cadence through the minute scheduler; snapshots have a fixed maximum 30-minute display lifetime, never renewed by serving them. Protected selection rechecks current rules. On entry/refresh retain an available chosen day, otherwise choose the next available day in the loaded month (or its first available future day); failed/empty months keep an honest state. An empty month offers an explicit See next month action within the public four-month horizon; loading that month selects its first available eligible day. Do not silently scan other months or alter the basket. Review remains editable and creates no booking.

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

**BR-013** — Show checking/preparation/payment-received states according to actual evidence. Payment received can remain booking pending until reconciliation is complete. Preserve customer details/reference during errors; expose confirmed actions only with authoritative confirmation. Sessions/instructors and total appear once in the summary; expanded details use stacked, left-aligned sections and the same label/value layout as Review, followed by concise disclaimers. Review and confirmation use shared 20px section headings and 16px body typography. Receipt tax data is independent of summary presentation. PDF/calendar exports require current authorization and validated booking evidence; a saved browser snapshot cannot bypass it. A revisited confirmation can export within its original checking window after fresh verification; stale evidence may be refreshed through bounded read-only booking/invoice checks, without reopening financial recovery or extending the window.

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

**BR-019** — Tail Worker `worker/telemetry.ts` implements conversion of allowlisted diagnostic summaries to OTLP/HTTP JSON for Grafana Cloud Tempo. Its committed configuration defaults to disabled. Require explicit attachment/configuration and ingestion acceptance for each environment; source availability is not evidence of activation. It runs after producer execution, outside customer request handling, with no provider/D1 calls. It does not fabricate parent-child continuity across RPC/alarms or represent aggregate durations as exact individual spans. Dashboard owner: `observability/grafana-dashboard.json`; configuration owner: `wrangler.telemetry.jsonc`.

<a id="br-020"></a>

**BR-020** — Defaults: 10% deterministic successful-correlation sampling; recognized failures bypass sampling within bounded limits. Maximum 32 Tail events, 256 log messages/event, 32 KiB accepted input strings, 128 spans and 512 KB outbound; five-second export timeout, 50 ms CPU, no redirects, persistent spool or retries. Failure retention is best effort. Activate only with secure endpoint/auth configuration and validate receiver ingestion, dashboard queries, correlation, redaction and overhead. Export HTTP success alone is not ingestion proof.

### Deployment, migration and acceptance

<a id="br-021"></a>

**BR-021** — Client PRs verify the exact head for staging; trusted-main controllers deploy only after all frontend/backend/live-email gates pass and current same-repository human-author permission and PR state are checked. Merge triggers independent production verification and exact-current-main deployment. Verification never receives deployment credentials; fork/bot and superseded candidates cannot deploy. Manual exact-revision dispatch remains supported. Existing D1, coordinator identity and first-use placement are preserved. Client bootstrap may create the configured Worker on its exact Workers.dev origin while customer/provider access stays closed; Pages/SaaS resources are required only for those explicitly selected targets. Pending migrations use the database ledger. Foundation registration, client activation and provider/device acceptance remain separate. Disable the former repository deployer before enabling client deployment; [Development](development.md) owns configuration and [Runbook](runbook.md) owns operator steps.

<a id="br-022"></a>

**BR-022** — Provision client resources only with applicable owner authorization, then validate/reuse the confirmed resources and portable configuration, test first install/rerun/interruption/account mismatch in isolation, report results and integrate before pushing to client GitHub. Keep access disabled through preparation; validate client provider entitlements, service/instructor mappings, shared capacity, schedules, notification configuration, merchant/payment destination, domain/email verification and legacy receipt/recovery continuity before UAT/cutover. A credential swap or green CI alone is not production acceptance.

<a id="br-023"></a>

**BR-023** — Bounded synthetic load is accepted for 1/3/5 baseline/fault cohorts and separate ten-customer overload/retry profiles. Original ten-customer all-success failure remains evidence: eight admitted/two rejected. Admitted attempts recovered; explicit same-ID retries created unpaid payments without duplicates. CI runs only the 1/3 smoke matrix. Synthetic providers establish application invariants, not live provider limits or sustained capacity. Original roadmap 1/5/20 release workload remains separate.

<a id="br-024"></a>

**BR-024** — Owner accepts normal payment/recovery/dismissal, 15-minute timeout and the observed long-open confirmation remaining confirmed. Deployed logs prove public-token SQLite restoration outside memory; HAR08 measured one 4.87-second checkout including a 0.992-second token miss. HAR09 is identical and proves no fresh network read. Batch later-item rollback/failed closure and in-flight late settlement remain unproven owner-accepted risks. Keep financial policies unchanged. Remaining: client rollout/UAT, Grafana validation, and regression checks after UI/UX/email refinements; further warm/batch performance and sustained-capacity work are optional follow-ups, not blanket milestone closure.

### Client hosting setup (prepared, not deployed)

<a id="br-025"></a>

**BR-025** — Current owner decision: bring up the closed client Worker on Workers.dev first; connect `soccerbotsg.com` later. Cloudflare Registrar transfer follows destination-zone activation; delegation and registrar transfer remain separate owner/vendor actions. Serve `https://soccerbotsg.com` directly with managed, automatically renewed HTTPS. Registrar ownership and DNS delegation are separate operations; neither is recorded complete. Confirm exact registrar, account IDs, hostname ownership, preserved email/DNS records and DNSSEC transition before any owner-executed change. Reassess supported Worker routing/custom-domain configuration after ownership verification; same-account DNS may remove the need for SaaS, but this documentation does not change deployment manifests or establish that configuration. The earlier SaaS proof used client zone `soccerbotsg.win` and Primary-owned `standardsoftwares.com`; these are retained test resources, not the current production ownership decision. If reused, prove subdomain and apex separately. `app404.ai` remains excluded.

<a id="br-026"></a>

**BR-026** — **Prepared SaaS implementation, pending reassessment under BR-025:** the fallback `fallback.soccerbotsg.win` was recorded active during setup; recheck it before deployment. Deploying this existing SaaS target requires the declared zone in the selected account, active/unpaused status, an active matching fallback, its proxied originless `AAAA 100::` record, and no competing routes. The target/release configuration declares the zone-scoped `*/*` route; verify it in the exact tested artifact before deployment. All client requests run through the Worker before assets, so alternate origins are rejected. Worker previews and Workers.dev are disabled. The optional Pages entry remains available for separately configured targets; this client target does not create or require a Pages project. This retained SaaS configuration is not the selected Workers.dev bootstrap target. The current target remains closed and has its client public Turnstile sitekey; secret installation and provider acceptance remain pending.

<a id="br-027"></a>

**BR-027** — D1 resource identity and placement evidence are in the 27 October provisioning entry. Do not self-register its immutable foundation or initialize the coordinator without the selected placement hint. Deploy the verified application artifact, preserve developer staging identity/data, and record first-install, interrupted-install, safe-rerun and rollback acceptance. Provider secrets are unnecessary for closed domain proof; install client provider credentials only for separately accepted integration/UAT. Production origin changes require appropriate target re-verification, including build-time settings.

<a id="br-028"></a>

**BR-028** — The client repository will own both environments: trusted PR staging continues to the existing developer Cloudflare/SimplyBook/Resend/Turnstile and payment sandbox configuration, while production uses client resources. The candidate workflows implement automatic trusted-PR staging and verified-main production deployment; adoption by default-branch main and successful client-owned deployment remain pending. Deny forks and Dependabot deployment credentials and prevent competing repository deployment ownership. Grafana uses the owner company’s central account, with separately scoped ingestion credentials and environment/service labels; activation remains pending. Maintain weekly Dependabot version updates and blocking dependency audit. Alerts/security updates were owner-confirmed for the developer repository; verify client settings independently. Optional licensed scanning capabilities require separate inspection. Do not treat an old clean advisory report as current security clearance.

### Client initial placement strategy (planned)

<a id="br-029"></a>

**BR-029** — Choose database and coordinator placement together before the client account Durable Object is first used:

1. For a new installation, create D1 with the `apac` location hint only under provisioning authorization; for the existing client database, reuse its recorded identity rather than creating another database. In either case, inspect primary-query metadata (`served_by_primary` and `served_by_colo`) to establish its actual serving location. A hint is best effort, not a guaranteed city.
2. If the primary is in Japan, prefer the account DO hint `apac-ne`; if near Singapore, prefer `apac-se`. For another location, measure before selecting. Keep these environment-specific choices in validated configuration, not repository/account hardcoding. The validated target and shared `coordinatorStub` now apply this hint in source; provisioning and actual execution-location acceptance remain separate.
3. Apply the chosen hint on the new account object's first creation/use. Leave frontend/entry Worker routing unchanged initially; Worker placement does not relocate the account DO. Do not rename or replace an existing object to move it without a separate plan preserving coordination, token and recovery state.
4. Verify the DO's actual execution with Cloudflare GraphQL `durableObjectsInvocationsAdaptiveGroups` or `durableObjectsPeriodicGroups`, grouped by `objectId` and `coloCode`; record namespace/object identity and observation window. Incoming `request.cf.colo`, provider response edges and the requested hint are not execution-location proof. Missing analytics is inconclusive.
5. Validate owner-operated checkout end to end, including provider timings, D1 round trips, queue waits and failures. Nearby D1 is an initial candidate-selection rule, not proof of the globally fastest placement or a 2–3-second checkout.

<a id="br-030"></a>

**BR-030** — The source implements the configured first-use hint; it does not prove remote object placement or authorize new provisioning/migration. Preserve existing developer coordinator identity and placement. Evidence and limits belong to [Journey history](journey.md#part-2--dated-changes-and-evidence).

### Checkout placement experiment — waived

<a id="br-031"></a>

**BR-031** — Owner waived the separate real-checkout placement comparison on 22 October 2026. Do not prepare/deploy its two variants, cold-token reset control or quiet-window procedure as outstanding work. No resources were created for that comparison. Retain the completed bounded read-only screening and actual location evidence in Part 2; waiver is not a measured speedup or a latency acceptance pass.

<a id="br-032"></a>

**BR-032** — Follow the client initial placement strategy above: verify the new D1 primary location, prefer `apac-ne` when it is in Japan, then verify actual DO execution and checkout during normal client UAT. Reduced database network time is an engineering expectation; end-to-end savings and a 2–3-second cold checkout remain unproven. Existing developer coordinator placement is unchanged. The earlier preparation protocol is retained in Git history, not an active execution instruction.

Foundation management implements the separate registration step through a trusted named service binding only. Closed-production inspection must not instantiate the coordinator. Registration must validate the real namespace-derived identity, retain a matching singleton across repeats/restarts, and reject mismatches without update/delete. First initialization is a separate diagnostic using the reviewed placement hint; its success does not establish location or provider/customer readiness. See the [runbook procedure](runbook.md#closed-production-foundation-registration).
