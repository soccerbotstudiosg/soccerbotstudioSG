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

**BR-001** — Customer booking website for one Singapore venue and one shared studio across instructors. Sessions are 40 minutes on 50-minute starts, 1–4 players, with up to five selected sessions per new checkout. Historical booking/receipt reads retain their existing capacity. After choosing a time, the customer explicitly chooses an eligible trainer from that slot’s dropdown; each session has its own independent choice. Changing trainer replaces that slot’s selection, never adds another simultaneous session. Below the booking summary, show one compact trainer panel with one avatar/name row per stable instructor ID and a unique-trainer count. Biographies start collapsed; opening one closes the previous profile. Session dates/times remain in the cart. Singapore time and SGD apply. Booking closes four hours before start: exactly 240 minutes is eligible; less is rejected in calendar filtering and server preparation/pre-write validation. Staff portals, memberships/packages, recurring charges, payroll and historical data migration are outside the commissioned website scope unless separately agreed.

The following capacity and recovery invariants are mandatory under BR-001:

- **Capacity belongs to the studio:** at most one booking occupies any studio time, including the required changeover. Trainer, service type, player count, browser tab and customer identity never create parallel capacity. Current starts use the studio-wide 50-minute grid; adjacent valid starts remain bookable. Trainer eligibility is a separate selection constraint, not a capacity partition.
- **Display is not reservation authority:** cached availability permits browsing only. Provider booking acceptance remains authoritative; a stale offer, refresh, timeout, redirect or failed read never permits bypassing a rejection or replaying an uncertain write. SimplyBook shared-resource configuration requires owner acceptance.
- **Conflict must not switch bookings:** a proven rejected selection returns to selection recovery. An unrelated owned active checkout is offered through an explicit action; never silently replace the requested draft or open its payment page. An uncertain dispatched attempt retains its original identity and protected recovery.
- **Repair cache locally:** on proven selection rejection, remove the rejected cart selection(s) and overlapping studio offers across all trainers. Preserve contact details, unaffected dates/months and valid cached offers. Do not clear the whole calendar or require the next scheduled warm to display already-valid data. Provider latency, a genuinely missing/expired cache and unverified release remain separate conditions; never invent availability to eliminate waiting.
- **Payment safety survives navigation:** completed-return hints may hide Continue payment but cannot establish payment. Do not clear a newer unpaid/uncertain attempt when leaving an old receipt. Expiry alone is not proof of unpaid release or permission to charge again.

The decision contract is in [API contracts](api-contracts.md#conflict-recovery-decision-contract); implementation and regression obligations are in [Technical behavior](code-owners/technical-behavior.md#shared-studio-conflict-regression-contract). These are standing rules, not a claim of deployed acceptance.

The shared studio grid is anchored at12:00 Singapore time for the12:00–20:00 operating window. Trainer changes and existing bookings must not shift that anchor. Availability may remove a start or trainer; it must not introduce off-grid starts. Each row contains40 minutes of play and10 minutes of changeover:

| Start | Playing session | Changeover ends |
| ----- | --------------- | --------------- |
| 12:00 | 12:00–12:40     | 12:50           |
| 12:50 | 12:50–13:30     | 13:40           |
| 13:40 | 13:40–14:20     | 14:30           |
| 14:30 | 14:30–15:10     | 15:20           |
| 15:20 | 15:20–16:00     | 16:10           |
| 16:10 | 16:10–16:50     | 17:00           |
| 17:00 | 17:00–17:40     | 17:50           |
| 17:50 | 17:50–18:30     | 18:40           |
| 18:40 | 18:40–19:20     | 19:30           |

There is no19:30 start: its playing session would end20:10, beyond closing. The remaining19:30–20:00 interval cannot fit a complete session. This grid is distinct from the account-wide limit of one simultaneous booking including changeover. Public normalization and new-checkout validation enforce this grid. Admins may enter off-grid manual package/event bookings; these records retain their actual times and block overlapping public sessions rather than moving the grid. A trainer is offered only when the provider reports a continuous free interval covering the entire40-minute session and10-minute changeover. For example,14:00–16:00 free permits14:30, but not15:20; a manual13:00–13:50 booking blocks public12:50 and13:40. Provider interval semantics and shared-capacity enforcement require owner acceptance; see Progress for local/deployed evidence.

<a id="br-002"></a>

**BR-002** — SimplyBook owns services, schedules, eligible instructors, customer/booking/invoice records and configured shared-studio capacity. Browser labels, prices, dates, IDs and cached availability are never write authority. The server validates identity, account, service, time, price and current operation scope. Direct checkout deliberately omits extra live catalogue/availability preflight; provider creation enforces availability and every creation response is validated. Capacity configuration does not prove batch atomicity.

Owner-confirmed rule (31 October 2026): both staging and client production allow only one simultaneous booking across the SimplyBook account, across all trainers/services, including the changeover buffer. Admins have no exemption. Trainer weekly availability remains off; approved date-specific entries define working availability. Provider settings confirmation and controlled enforcement acceptance are separate evidence.

Owner-confirmed client prices are S$108 on weekdays and S$128 on weekends and gazetted Singapore public holidays, including substitute holidays. Developer staging/demo retains S$88/S$108. The shared pricing owner selects the trusted environment; native browser display retains server quotes. Production service IDs 3/4 and company `soccerbotadmin` still require reviewed runtime integration before activation; a pricing helper does not establish provider/payment readiness. Owner confirmed four-hour advance notice. The latest requested policy is a10-minute unpaid provider hold with an eight-minute customer payment window and one-minute checking buffer. The owner screenshot shows the provider supports10 minutes; the saved live setting still needs owner verification.

### Identity, privacy and environment isolation

<a id="br-003"></a>

**BR-003** — Email proof precedes protected existing-customer lookup/prefill. Missing, duplicate or shared-email identities must not leak another customer's details. Guests use server-issued protected capabilities; browser storage/URLs are not credentials or ownership evidence. Turnstile, email challenge limits, expiry, signed/session authority and revocation remain enforced. Resend delivers verification codes; SimplyBook handles booking notifications on final payment in the accepted account configuration. These are separate email flows. Email verification permits saved-contact identity; it does not create a customer reservation-management account. Customer notifications must not offer self-service editing, cancellation or rescheduling.

Email-code policy (consolidated local candidate; deployment evidence belongs in Progress): each newly issued code expires120 seconds after issuance, capped by the authenticated access expiry. A further code may be requested while an earlier code remains valid; issuance does not supersede or extend earlier codes. Verification accepts an unconsumed valid code for the same authenticated capability and normalized email, using its own expiry and attempt budget. The third admitted request in a session, normalized-email or trusted source-IP cycle starts a fixed600-second block from that request. Successful issuance does not show a red block notice; a later denied request reports the actual remaining deadline. Denied requests neither send mail nor extend the block. An observed shared-subject block remains attached to the session owner across network/email changes. Aliases are separate normalized addresses. The cycle resets after ten minutes without an admitted request; independent service-wide safeguards retain their own deadlines. Codes already issued before this candidate retain their stored expiry; migration0047 changes admission without rewriting historical challenges or counters. Verification stays available during request blocking; consumption, wrong-guess limits, revocation and access checks remain enforced.

New customer reservation creation requires server-validated Turnstile proof for action `create-checkout` and the configured hostname, prepared on Review Booking. Proof is bound to the authenticated capability, exact checkout intent and attempt key; a retained receipt permits safe same-intent retries after lost responses. Existing owned idempotency keys (including permanently rejected preparation keys), payment continuation, callbacks and recovery do not require another interactive challenge, and all existing authentication/signature/state checks remain mandatory. Proof cannot replace availability, payment or booking authority.

Access lifetime: explicit access entry and checkout POST may renew an authenticated unexpired guest capability for the configured duration, preserving its owner. Expired/revoked capabilities never regain their grants. Checkout, hold, checking and verified-email lifetimes remain separately bounded. A browser return marked completed suppresses payment links but is never payment evidence.

<a id="br-004"></a>

**BR-004** — D1 foundation identity must match the configured account, environment, database and coordinator. Protected operations fail closed on missing/mismatched bindings; no automatic claim of an unknown database. The read-only health endpoint may report `foundationRegistration: pending` for a fully disabled production installation with an existing empty foundation table; this never grants customer authority or performs registration. Foreign registration and unreadable/missing schema remain failures. Provider credentials remain Worker secrets. Returning contact profiles require explicit remember consent and current verified identity; sign-out revokes saved-profile access without deleting retained contact evidence. All-device email sign-out preserves other devices’ guest booking capabilities so already-entered contact details can complete checkout; local logout and token replay retain booking-capability revocation. All-device sign-out accepts any current server-verified email session, including remembered restoration, without a five-minute re-verification requirement; guest, expired and revoked authority cannot revoke identities. Identity proof remains memory-only for at most 30 seconds, bounded by token validity. Revalidate authorization for receipts/downloads and legacy recovery.

<a id="br-005"></a>

**BR-005** — Developer and client accounts, merchants, origins, mappings, secrets and data must stay isolated. Portable target validation and account/resource preflight exist, but client identity sender/production Turnstile credentials, sandbox HitPay hosts and provider safety scopes require deliberate client configuration. Moving repositories alone does not establish production portability. Client portability must replace those pins with validated configuration, not remove account/host guards.

### Availability and selection

<a id="br-006"></a>

**BR-006** — Availability and display cache

- Public display snapshots support fast browsing; they do not authorize bookings.
- Scheduled warming maintains the current Singapore month and the next two months (the complete public browsing horizon).
- Each minute admits one due month, prioritizing missing snapshots then the least recently attempted month; fresh months are reused until15 minutes old.
- A failed or interrupted month waits at least one minute and cannot starve its siblings.
- Warming yields between provider operations for waiting customer/recovery work; snapshots have a fixed maximum 30-minute display lifetime, never renewed by serving them.
- Booking dispatch or an authoritative selection-unavailable result removes overlapping50-minute studio intervals across trainers from the shared snapshot and invalidates the affected short-lived calendar read; it does not expire all months or trigger a full rebuild.
- Provider-confirmed day reads or scheduled refresh restore released availability; a local expiry timer is not release proof.
- Unknown dispatches keep affected display windows hidden until authoritative availability resolves that display uncertainty. Availability never establishes the outcome of an uncertain booking write or releases its attempt.
- Off-grid retained offers are removed without extending snapshot expiry.
- External manual edits become visible through fresh provider reads or warming; no immediate admin-event cache invalidation is currently implemented.
- Checkout remains provider-authoritative even while another browser retains an older snapshot.
- Protected selection rechecks current rules.
- On entry/refresh retain an available chosen day, otherwise choose the next available day in the loaded month (or its first available future day); failed/empty months keep an honest state.
- An empty month offers an explicit See next month action within the public three-month horizon; loading that month selects its first available eligible day.
- Do not silently scan other months or alter the basket.
- Review remains editable and creates no booking.
- Background warming retains the current valid month until a complete, generation-matched replacement is ready; partial or failed builds never replace it.
- Browser display expiry requests the active month once while retaining the date grid. Expired offers remain unselectable; a failed replacement exposes Try again rather than looping or extending freshness.
- Expiry refresh shows the shared spinning loader inside the calendar for0.5 seconds; dates do not fade. Month navigation, explicit expiry/conflict reconciliation and scope changes remain valid read triggers; cart edits do not force a month rebuild.

### Checkout, durable effects and customer errors

<a id="br-007"></a>

**BR-007** — Flow: calendar → Details → Review/consent → reserve attempt authority → create/validate all sessions → retain complete booking association → reserve payment effect → create/save HitPay request and URL → handoff. Single uses book; batch uses createBatch, sequential book calls and closeBatch. Each provider write requires durable claim/evidence first. Retain raw booking evidence and provider references before strict validation. Validate batch closure, membership, invoice/account, currency and total before any payment. No payment for an incomplete batch. Editable Review consent is cleared whenever Review is left or reopened, including reload; an already dispatched attempt retains its immutable accepted snapshot.

<a id="br-008"></a>

**BR-008** — Unknown write outcomes retain original attempt identity and evidence. Never blindly replay creation, invent success, delete uncertainty, renew grants/deadlines or automatically cancel unknown bookings. Repeated requests return protected saved results according to grant state; they do not create duplicate effects. A claimed grant does not alone prove a provider session exists. A separate immutable no-creation resolution may retire the exact active grant only after explicit authenticated single-book date/time rejection (`-32053`/`-32054`) or restricted operator verification that the original provider processing finished and created no intended booking. Bind that proof to the original intent/version/dispatch and exclude booking/payment evidence; preserve the journal and fence further effects on the resolved attempt. Empty searches, free slots, missing references, elapsed time and generic errors are insufficient. A customer may then return to Calendar and start a new explicit booking; resolution never replays the old write. [The contract](api-contracts.md#verified-no-creation-resolution) owns the precise guards and provider sources.

<a id="br-009"></a>

**BR-009** — Explicit preparation rejection must retain immutable owner/key/input-bound no-dispatch proof before reporting a safe rejected start when no attempt exists. Its protected context remains readable across reload, and database fences prevent that key later becoming an attempt. An existing original attempt, failed proof persistence or unknown read remains recovery-required; an arbitrary404 is never no-effects proof. When authenticated evidence identifies protected overlapping studio windows, return the complete known affected-index list without a provider identity/availability dependency. The browser returns to Calendar with one conflict notice and bullets, removes only those known selections, and preserves other selections subject to fresh eligibility checks. Generic rejection with no affected indexes still requires complete successful fresh classification; failed/partial reads do not invent unavailability. Restore accepts only matching protected evidence and never another tab's checkout. Empty all-available classification preserves the cart. No-creation resolution remains distinct from selection conflict and expiry.

### Payment, reconciliation and expiry

<a id="br-010"></a>

**BR-010** — An eligible unpaid return offers Continue payment with the same retained HitPay link and an original-expiry countdown. Reopening never creates a payment or extends its deadline; paid, expired, denied or unresolved states offer no continuation. Polling remains active and browser expiry alone never claims cancellation. HitPay hosts payment; secrets and payment verification stay server-side. Bind merchant, account, attempt, invoice, amount/currency and request identity before accepting evidence. Browser return and webhook payload alone never confirm a booking. Authenticate webhooks, retain/deduplicate receipts, and read authoritative provider state. Recovery preserves original financial claims and handles delayed/duplicate/out-of-order delivery without duplicate accounting.

<a id="br-011"></a>

**BR-011** — Original booking creation anchors new attempts' eight-minute payment window, nine-minute checking deadline, twelve-minute conservative recovery boundary and ten-minute configured provider hold deadline. SimplyBook cancellation may lag this deadline; elapsed time alone never restores capacity. Migration0037 preserves older attempts' recorded windows and five-minute buffer; new attempts record a one-minute checking buffer. Migration0038 adds a separate immutable three-minute recovery buffer to new attempts; historical rows retain zero. An earlier provider deadline remains authoritative. These are different clocks. Browser expiry, deleted/expired payment links or exhausted polling do not prove settlement impossible. Protect unknown in-flight outcomes. At or after the actual payment deadline, authenticated matching expired/canceled HitPay evidence with an explicit empty payment list or only matching, zero-refund `requires_payment_method` entries may release the active customer grant without waiting the checking/recovery buffers. A missing payment-request row retains the original conservative recovery and provider-hold deadlines. Governed recovery wakes at the actual payment-link expiry to seek proof; a pending/failed provider read does not unlock checkout. Known money, unknown accounting and unprocessed webhook receipts prevent release. Payment journals and archived grants remain immutable; a later paid receipt reconciles the original attempt and cannot recreate an expired booking. After verified payment, reconcile SimplyBook accounting and require current valid-booking/paid-invoice evidence before final confirmation. A complete validated payment-recording response may supply that evidence after the original booking check; an incomplete or inconsistent response requires authoritative readback. HTTP success alone is insufficient. Preserve the first valid confirmation timestamp on later visits. Refunds are owner/provider operations; cancellation is not a refund.

- New ongoing customer checkouts allow at most5 sessions; a single unpaid checkout expiry counts once regardless of session count.
- Customer strikes: first expiry permits another reservation; second and every later expiry blocks new reservations for1 hour. A verified successful payment resets customer strikes.
- Shared-IP backstop: count expiries within a rolling24-hour window; second and later expiries block new reservations for1 hour. Payment does not reset the IP counter.
- Count only server-proven unpaid expiry under the financial release predicate. Paid, unknown and unprocessed-receipt states do not count; a browser timer cannot create a strike.
- Each attempt counts once at the same original expiry boundary used by financial release: actual payment deadline with terminal-unpaid evidence, conservative recovery/hold boundary without a payment row. Existing historical strike timestamps are not rewritten. Repeated reads do not renew blocks; closing the browser does not evade lazy server reconciliation.
- Blocks affect new reservations only. Browsing remains available, and existing financial recovery retains its original authority. Verified no-creation is not unpaid expiry and creates no strike; it does not bypass an already-active customer or shared-IP block.
- Customer identity uses verified email where available, otherwise server-issued guest ownership. An observed denial is retained against that customer hash and the authenticated owner until the original blocked-until time. Network changes, guest/email identity transitions and repeated clicks do not restart or bypass that observed cooldown. Verified payment still resets customer strike counting, but does not shorten an already-observed denial. This carry-over can affect an unrelated guest denied on a shared network even after leaving it. Guests remain unverified; a wholly new guest identity on another network remains unlinked and can evade this backstop. Unverified booking contact details never link customers.

<a id="br-012"></a>

**BR-012** — Polling: at most one check per two seconds for the first 20 checks, then at least ten seconds, with allowance 120 and the original checking deadline. An unresolved page rechecks automatically on focus/foreground (coalesced, minimum30 seconds) and once at the original server hold expiry; no customer-facing status-check button is exposed; hidden pages catch up when visible. This does not restart polling or authorize expiry. At payment-window expiry, unresolved unpaid customers return to Calendar with an empty cart while the original attempt remains protected. Availability reads and replacement Calendar/Details/Review navigation remain usable; only dispatching a new checkout stays blocked pending safe resolution. The expiry notice persists across refresh on Calendar, clears on its first departure and cannot be revived by late recovery. Confirmed/denied pages stay terminal. Only authenticated server outcome permits release. Completed dismissal is repeatable; lost acknowledgement must not create a second attempt or erase uncertain evidence.

Before a checkout link is obtained, unresolved creation recovery may restore the original affected Calendar times after a new matching fresh availability read positively offers them. This changes display and editable selection only: the original financial attempt and Details/Review/checkout guards remain until authoritative resolution. Failed, missing, stale or differently scoped responses do not restore times. Existing issued-link unpaid-expiry recovery retains its original suppression behavior. If verified no-creation later releases the attempt, preserve deliberate selections of already restored original times; normal fresh eligibility and server admission still apply.

Calendar presentation may retain last-known date indicators and session cards during a background refresh or retry, but expired offers remain unusable as current selection/checkout evidence. Retained session presentation is scoped to the same service owner, service, requested dates, players, booking scope and authentication; minute ticks alone do not discard it. Unknown or failed reads are not unavailable-day proof and must retain explicit failure feedback. The month picker trims only trailing months proved empty by complete, fresh cached coverage; missing, expired or partial coverage remains unknown. This display restriction does not reduce the three-month warming or booking-policy horizon.

### Confirmation and presentation

<a id="br-013"></a>

**BR-013** — Customer-facing errors and notifications use brief plain-language outcomes and a safe next step. Never render raw server/provider errors, internal identifiers, diagnostic codes or recovery machinery. Do not claim payment or confirmation without evidence, or invite another payment while its outcome is uncertain. Page-level errors share the `alert` style/role; informational and successful notices share `notice` with a polite status role; field errors remain beside their associated input. Loading uses the shared branded indicator and concise status text. Feedback headings and body text have explicit spacing; the confirmed icon has a brief entrance animation only when reduced motion is not requested. Paid-evidence recovery messages must not say payment is unconfirmed. Show checking/preparation/payment-received states according to actual evidence. Payment received can remain booking pending until reconciliation is complete. Preserve customer details/reference during errors; expose confirmed actions only with authoritative confirmation. Initial protected payment verification without an eligible continuation uses the shared full checkout loader; subsequent automatic reads retain the displayed view without spinner flashes. At first observed payment expiry, allow20 seconds of full-animation reconciliation for that attempt and original deadline, with at most10 additional seconds only if no successful status read started after expiry has returned; refresh preserves the remaining display window. Known payment follows confirmation, proven releasable unpaid expiry exits early, and unresolved expiry returns to usable Calendar with silent recovery afterward. This presentation window never extends payment, changes server polling limits or unlocks financial authority; conflict handling is unchanged. Eligible unpaid continuation on the original payment page or a non-completed hosted-provider return shows the booking summary, then the timer and Continue payment as the last element and opens the retained link in the same tab. It requires the original server-authorized unpaid handoff within its payment deadline; authenticated payment evidence or a completed-return display hint suppresses continuation. Neither arrival on that route nor its query parameters prove payment. Sessions/instructors and total appear once in the summary; confirmed expanded details use stacked, left-aligned sections and the same label/value layout as Review, followed by concise disclaimers. Review and confirmation use shared 20px section headings and 16px body typography. Receipt tax data is independent of summary presentation. Customer PDF/calendar actions and local generation are retired by owner decision. Protected receipt APIs retain their existing authorization, freshness and original-window rules; removing the buttons does not authorize stale reads or change payment recovery. Confirmed live bookings display the optional provider-supplied invoice number unchanged for owner flow testing; its match to the final SimplyBook Pay document remains unverified. Omit the label when absent or pending; never invent an SI prefix or expose internal IDs as a replacement. Optional retained metadata cannot weaken or delay confirmation. Changes/cancellations are requested from Glenna on WhatsApp (+65 9014 3819); the booking stays unchanged until the studio confirms the request.

### Storage, queue and tokens

<a id="br-014"></a>

**BR-014** — D1 holds minimal access/attempt/grant/effect/payment/webhook/recovery and immutable no-creation-resolution evidence and display snapshots; it is not a replacement booking system. Apply additive compatible migrations, never rewrite accepted migration history or reset records to conceal failures. The account Durable Object owns serialized provider workflows and persistent SQLite coordination/token state.

<a id="br-015"></a>

**BR-015** — One active workflow; at most 24 waiting jobs with the last four reserved for recovery. Waiting jobs expire after 15 seconds before execution with 503 provider_queue_busy. Recovery gets the next turn, at most two consecutively while customer work waits; display gets a turn after four foreground jobs. FIFO within each priority. Cached display reads can bypass the queue. Physical provider concurrency is separately bounded to two; identified ended/expired transports may release capacity with audit evidence, but unknown financial effects remain fenced. Do not interpret slot release as authorization to replay a write.

<a id="br-016"></a>

**BR-016** — Two AES-GCM-encrypted account/environment/credential-scoped tokens persist in Durable Object SQLite, not D1. Public and admin access retention is 50 minutes, based on the normal one-hour provider lifetime, with original absolute expiry unchanged by hits/restoration. Earlier provider expiry remains authoritative. Admin refresh tokens persist inside the encrypted family payload; a conditional durable delete consumes each single-use refresh token before transport. Lost refresh responses cannot replay that token. A401/419 rejection retires access but retains a valid refresh token for the next operation;403 invalidates the family. Neither path replays the rejected protected operation. Late401/419 expiry of retired access cannot invalidate its in-flight or published replacement;403 and rejection of the refresh request itself still invalidate the family. The rejected request still fails and retains its account cooldown. Token publication checks invalidation both before the durable write and after its awaited completion, before restoring the in-memory token. Restoration never substitutes for current identity/booking/payment verification. Logs distinguish restoration, expiry, rejection and invalid records without token values. With `PUBLIC_TOKEN_REFRESH_AHEAD=enabled`, the existing serialized display-warming workflow replaces a still-valid public token when at most 20 minutes remain. It retires the old generation before authentication; replacement gets its own fixed 50-minute lifetime. A failed replacement leaves the old token retired, with no immediate retry. Empty/expired caches use normal demand authentication. Public refresh-ahead is independent of admin refresh-token rotation. The closed configuration defaults off; the verified developer live-release profile enables it. This reduces miss frequency, not the duration of a genuine cold miss or a guarantee of uninterrupted availability.

<a id="br-017"></a>

**BR-017** — Successful single checkout uses six coordinator D1 calls plus one HTTP foundation/authentication call (seven total); reconciliation uses five D1 calls. Batch checkout uses 2×sessions+8 coordinator calls plus one HTTP call (13/17/19 total for 2/4/5 sessions), excluding coordinator SQLite. These are measured/source successful-path counts, not absolute minima or caps on failure/recovery. Overlapping provider/storage timings must not be summed as exclusive wall time.

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

**BR-024** — Owner accepts normal payment/recovery/dismissal, 15-minute timeout and the observed long-open confirmation remaining confirmed. Deployed logs prove public-token SQLite restoration outside memory; HAR08 measured one 4.87-second checkout including a 0.992-second token miss. HAR09 is identical and proves no fresh network read. Batch later-item rollback/failed closure and in-flight late settlement remain unproven owner-accepted risks. That historical acceptance does not accept the new8/9/10 timing or verified unpaid-release behavior. Remaining: client rollout/UAT, Grafana validation, and regression checks after UI/UX/email refinements; further warm/batch performance and sustained-capacity work are optional follow-ups, not blanket milestone closure.

### Client hosting and domain acceptance

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
