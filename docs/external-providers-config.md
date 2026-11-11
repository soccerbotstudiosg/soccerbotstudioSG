# External providers configuration

Configuration reference reviewed 2 November 2026, Singapore. This document explains the intended settings and the latest evidence for SimplyBook, Resend, HitPay and Cloudflare. It contains no credential values, customer records or raw diagnostic logs. It is not an instruction to activate services or copy staging credentials into production.

[Development](development.md) owns executable configuration names and commands; [Runbook](runbook.md) owns deployment, recovery and rotation procedures; [Progress](../PROGRESS.md) owns the current release and next action; [Journey](journey.md) retains dated evidence. Target manifests own reviewed infrastructure identifiers. Update this reference when provider settings change, recording whether evidence is API-observed, owner-confirmed or still pending. A historical check is not a live monitor.

## Environment boundaries

| Area                                      | Developer staging                                         | Client deployment                                                           |
| ----------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Purpose                                   | Development and owner acceptance with developer resources | Client infrastructure; closed after PR19 release, not accepted live trading |
| SimplyBook company                        | `soccerbot`                                               | `soccerbotadmin`                                                            |
| Weekday / weekend and public-holiday rate | S$88 / S$108                                              | S$108 / S$128                                                               |
| HitPay                                    | Approved app404 sandbox                                   | Same approved sandbox temporarily; live merchant setup pending              |
| Cloudflare Worker                         | `soccerbot-dev`                                           | `soccerbot-production`                                                      |
| Source of intended settings               | [Staging target](../deployment/staging.json)              | [Production target](../deployment/production.json)                          |

The same application implements both profiles. Public catalogue metadata selects the displayed price profile; calendar quotes, booking validation and payment matching remain authoritative. Display text cannot authorize a charge. Staging tests exercise the shared UI and recovery logic, but do not establish client account settings, exact client amounts, live payments, email delivery or production latency. The two deployments may temporarily run different revisions; check release receipts before comparing behavior.

Latest release evidence (2 November2026,22:51 Singapore): productionfc52077 passed deployment health with customer/provider/HitPay checkout/identity delivery/client sandbox disabled. Earlier sandbox overrides are historical, not current activation. Staging retains its independently verified7634a29 candidate. [Progress](../PROGRESS.md) owns exact run/version receipts.

## SimplyBook — schedules, bookings and invoices

SimplyBook owns availability, booking records and invoices. HitPay collects payment; the application verifies it and records external payment against the original SimplyBook invoice. Provider timeouts and uncertain writes must not cause duplicate bookings or accounting operations.

### Service mapping

Both service lists were read through their respective connectors on 2 November 2026. Client company information independently reported login `soccerbotadmin` and timezone `Asia/Singapore`.

| Setting                                    | Staging                 | Client                  | Reason                                                                                            |
| ------------------------------------------ | ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Weekday service                            | ID2, S$88               | ID3, S$108              | Explicit company-local service mapping                                                            |
| Weekend / Singapore public-holiday service | ID3, S$108              | ID4, S$128              | Date-based premium price; IDs are not portable between companies                                  |
| Currency                                   | SGD                     | SGD                     | Payment amount/currency must match the original invoice                                           |
| Session / changeover                       | 40 minutes / 10 minutes | 40 minutes / 10 minutes | Studio occupancy includes changeover                                                              |
| Linked provider IDs                        | 2, 3, 4, 5, 6           | 2, 3, 4, 5, 6           | All five are linked to both services; equal IDs do not establish shared identity across companies |

Client active roster API-observed on 2 November: Faisal (2), Nabil (3), Caelan (4), Rifqi (5), Azam (6). Add future trainers through reviewed provider/service mappings and schedule checks; the application reads the complete bounded linked roster rather than assuming three or five trainers forever.

The approved prices are centralized in `src/domain/session-pricing.ts`. Changing a tariff requires reconciling SimplyBook services, that profile, display/quote tests and owner acceptance together. A provider price that disagrees with the configured profile is rejected, not silently accepted.

### Capacity and scheduling

| Setting                            | Latest evidence                                                                                                                                                         | Meaning / remaining check                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account-wide simultaneous bookings | Owner confirmed one for both environments on 31 October; admins cannot exceed it                                                                                        | Applies across trainers. Preserve the shared studio and changeover constraint; controlled customer/admin cross-trainer acceptance remains required            |
| Client advance notice              | Owner confirmed four hours                                                                                                                                              | Provider setting; do not infer enforcement from a displayed slot alone                                                                                        |
| Client unpaid invoice timeout      | Owner reverted the decision to ten minutes and supplied a screenshot showing10 minutes selected (6 November); saved/effective invoice deadline still needs verification | An unpaid invoice may expire/cancel at the provider; successful payment must be reconciled against the original booking/invoice                               |
| Company/service hours              | Prior read-only inspection recorded noon–8pm daily                                                                                                                      | Trainer availability further constrains bookable times                                                                                                        |
| Trainer scheduling                 | Owner intentionally uses date-specific availability; weekly days were off at prior inspection                                                                           | Enter schedules on the common 50-minute grid; recheck date overrides as well as weekly hours                                                                  |
| Initial mock schedule              | Prior authorized setup covered 3–21 November 2026 for five trainers                                                                                                     | Temporary test availability, not a production scheduling recommendation. Official opening is 22 November; existing entries from that date were left untouched |
| Grid evidence                      | Prior sampled reads on 3 and 21 November returned nine starts, noon through 18:40                                                                                       | Two sampled dates do not verify every date or future trainer                                                                                                  |

API, Accept Payments, Multiple Bookings, Limit Bookings and custom booking interval features were previously observed enabled. Enablement is not proof of current plan entitlements or each feature's settings. Verify the four-hour cutoff, the saved timeout against the current checkout timing policy, and capacity controls in the intended company before accepting real bookings. The earlier 15-minute confirmation is historical, not the current accepted setting.

### December/January test availability — 5 November 2026

Owner confirmed both months empty and explicitly authorized replacing date-specific availability. Production SimplyBook account `soccerbotadmin`: entered all 62 dates from 1 December 2026 through 31 January 2027, 12:00–20:00 Singapore time, no breaks, for Faisal (2), Nabil (3), Caelan (4), Rifqi (5) and Azam (6): 310 trainer-days. All five batch updates returned success. Independent reads of 1 December and 31 January for every trainer confirmed the hours, active special-day status and no breaks (10 checks). This is sampled readback, not a read of every saved date.

Cleanup scope: only those date-specific entries for provider IDs 2–6 over the inclusive date range above. Re-read before removing to protect later edits; clearing a special day returns it to the weekly schedule. No cleanup was executed and no bookings were created. Recurring weekly schedules, company/service hours and November were not changed. Cache rebuilding and browser latency acceptance remain separate and unverified after these writes.

### Admin authentication investigation — 3 November 2026

Test11 production telemetry shows six admin-auth requests between07:13 and07:21 UTC, including one403 during deferred checkout work. Before that rejection, observed successful logins were roughly61 and72 seconds apart; the next login failed roughly69 seconds later. This matches the deployed application's conservative60-second admin-token cache (`worker/provider-token-cache.ts`), not verified provider expiry. At the captured revision, `ProviderSession.token` retained only the access token, discarded refresh material and used a new credential login after local expiry. Source and RPC timing identify deferred booking comments as the post-checkout admin-auth path; the failing annotation itself was not dispatched if authentication failed.

[SimplyBook's October 2026 REST Admin clarification](https://tech-support.simplybook.me/t/rest-admin-catalogue-required-fields-least-privilege-and-uncertain-writes/2470) states a normal one-hour access lifetime, potentially shorter with HIPAA, and single-use rotating refresh tokens. Older support answers differ (30 minutes or configurable timeout), so the actual account timeout still needs verification. [The login-failure support discussion](https://tech-support.simplybook.me/t/1329-login-failure/1329) describes intermittent403 login rejection and recommends refresh tokens instead of repeated credential logins. Login throttling is a strong hypothesis for test11, not proven: our transport cancels failed response bodies and retains only HTTP status/operation, and no precise current login-rate threshold was established.

The captured revision adds overlapping coordination delays: unsuccessful authentication leaves its30-second refresh claim until expiry and sets a60-second account cooldown. A payment recovery refused during that window schedules another attempt90 seconds later, then depends on cron pickup. These are application policies, not provider-documented retry times. Test11's next recovery started about137 seconds after the first. Production values and code remain unchanged by this investigation.

The refresh request shape is corroborated by the [published SimplyBook support example](https://tech-support.simplybook.me/t/910-unauthorized-access/910): JSON `company` and `refresh_token`, with response `token` and `refresh_token`. The existing verified `user-api-v2.simplybook.me` host remains fixed; no new provider host is authorized.

The owner-approved local batch implements encrypted access/refresh-token rotation,50-minute access retention against the normal one-hour contract, safe consumption before refresh dispatch, status-derived failure classification, comments only after confirmed payment, and recovery alarms at the existing retry deadline. Shorter account expiry is handled on rejection without replaying the protected operation. Verify the actual account timeout and deployed refresh response during owner acceptance; these local changes do not establish provider acceptance. The connector could not expose API feature configuration (INVALID_ARGUMENT), and direct Swagger retrieval was blocked; this investigation did not log in with production credentials, change provider settings or contact support.

### Notifications, access and maintenance

The owner reported trainer notifications switched off during the recent setup conversation. This is owner-confirmed, not a fresh API inspection or proof that every customer/admin reminder channel is off. Review each relevant recipient/channel in SimplyBook notification settings before relying on suppression. Resend identity emails and SimplyBook booking/trainer notifications are separate systems.

Use individual staff accounts and existing provider records. Role capabilities, seats and costs need owner verification; do not assume a named junior role exists or that trainers can edit only their own schedules. Follow [Admin UAT](uat/admin.md) and [Trainer UAT](uat/trainers.md).

A separate SimplyBook-hosted landing-page description still contained older package marketing during the 2 November read. It is provider-managed content, not the website's tariff authority or an approved application package feature. Owner should reconcile that content before promoting the provider-hosted page. This reference deliberately does not reproduce it.

## Resend — application email delivery

Resend supports the application's email identity/account flows. It does not replace SimplyBook's booking/trainer notification configuration, and a verified sender does not itself enable application email delivery.

| Setting                  | Recorded state                                                                                                      | Required before client email acceptance                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Account ownership        | Owner confirmed client-controlled account                                                                           | Retain client login, billing, MFA and recovery ownership                                                             |
| Client domain            | `soccerbotsg.com`, registered in Tokyo region, sending only; tracking off at setup                                  | Domain and all four issued DNS records verified by Resend on 11 November 2026                                        |
| Intended sender          | `contact@soccerbotsg.com`                                                                                           | Authenticate the domain and verify the application's permitted sender scope; mailbox existence alone is insufficient |
| DNS changes              | Four Resend sending records added on 11 November 2026; existing mailbox records preserved                           | Preserve existing MX/SPF/DKIM/DMARC and mail hosting; review required records rather than replacing the whole zone   |
| Client identity delivery | Production sender configured in the pending email-activation release; deployed activation and physical test pending | Explicit configuration and owner-operated account/email acceptance required                                          |
| Staging sender           | Existing developer setup                                                                                            | Keep its credentials/sender separate; no claim of new sender verification here                                       |

The production Turnstile sitekey matches the client widget and permits the Workers.dev production hostname and soccerbotsg.com. Production RESEND_API_KEY secret presence was verified without reading its value. SimplyBook SMTP reports enabled/configured after owner setup: smtp.resend.com, SSL port465, username resend, sender contact@soccerbotsg.com. Saved SMTP settings do not establish delivery. Test website Turnstile/code verification first; then finalize SimplyBook notifications. Customers have no self-service reservation management: omit edit/cancel/reschedule links and direct enquiries to staff. Domain cutover remains pending; preserve current Workers.dev origin for this test. Use [email/account UAT](uat/simulated-user.md) for the applicable identity actions. Do not send test email merely to complete this inventory.

## HitPay — hosted payment and webhook recovery

Both environment mappings use the owner-approved app404 **sandbox**; the client release is currently closed. This is a temporary testing arrangement, not client live merchant ownership or proof of production readiness. The client Worker can create real SimplyBook booking/invoice records even when payment is sandboxed; owner tests need deliberate dates and capacity.

| Setting                | Configuration / explanation                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox identity       | Reviewed merchant/business identity is sealed in each target manifest; API key and webhook salt stay in the matching Worker secret store                                           |
| Staging webhook        | `https://soccerbot-dev.limyousheng-94.workers.dev/api/webhooks/hitpay`                                                                                                             |
| Client sandbox webhook | `https://soccerbot-production.lucky-poetry-b25e.workers.dev/api/webhooks/hitpay`                                                                                                   |
| Selected events        | Payment Request Completed and Failed, as selected during owner setup; unrelated event families are unnecessary for this integration                                                |
| Return route           | Same-origin `/confirmation/`; the application generates the attempt-scoped return URL. A browser return is not payment proof                                                       |
| Authentication         | Use the salt for the correct webhook endpoint. Do not replace staging's endpoint or reuse a different endpoint's signing secret                                                    |
| Recovery               | Verify original payment, amount, currency, merchant, environment and booking/invoice. Reconcile through the durable recovery path; never treat a timeout as evidence of no payment |
| Acceptance evidence    | Owner sandbox test3 previously completed with correlated webhook/recovery evidence; later recordings exercise return/continuation behavior. This is not live merchant acceptance   |
| Live merchant          | Verification, bank setup, reviewed live configuration and owner acceptance remain pending                                                                                          |

Shared sandbox ownership does not make payment records interchangeable. Preserve retained account/company/merchant/business/credential scope and original financial references. When the client domain changes, review webhook/return origins and runtime guards together; do not simply edit a dashboard URL and assume compatibility.

## Cloudflare — hosting, durable state and bot verification

| Area              | Staging                                    | Client                                                                             |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Account           | Developer account, ID in staging target    | Client account, ID in production target                                            |
| Worker and origin | `soccerbot-dev.limyousheng-94.workers.dev` | `soccerbot-production.lucky-poetry-b25e.workers.dev`                               |
| D1                | `soccerbot-dev-state`                      | `soccerbot-production-state`                                                       |
| Named coordinator | `simplybook-developer-account`             | `simplybook-production-account`                                                    |
| Placement         | Existing coordinator identity retained     | First acquisition uses reviewed `apac-ne` hint; prior telemetry observed KIX/Osaka |
| Turnstile         | Separate staging widget/key                | Separate client widget/key; keep allowed hostnames and secret paired               |
| Source default    | Developer sandbox                          | Closed access; owner testing has used a separately authorized runtime override     |

Resource IDs and public widget keys belong to the [target manifests](../deployment); do not copy or recreate them from this prose. D1 and Durable Object placement are distinct. A location hint or historical KIX observation does not guarantee a permanent Worker or object execution location. Preserve foundation registration and durable storage across deployments.

The owner authorized persistent once-per-minute recovery scheduling; prior runtime readback recorded it on both Workers. It supports recovery after browser closure and scheduled display refresh. Do not infer current trigger presence from source alone; inspect runtime settings when diagnosing missed recovery.

The canonical deployment owner is the client GitHub repository. Trusted, verified ready PRs deploy staging; independently verified merged main deploys the reviewed production artifact. Follow the [release procedure](runbook.md#6-deployments-and-rollback), including actual staging deployment and owner acceptance before merge. Staging remains a separate deployment when production is updated.

Source defaults and temporary runtime activation are different evidence. A normal client deployment can restore closed settings; an owner test override is not a permanent launch configuration. Never enable live payments/email or provision replacement D1/DO resources as a side effect of a routine staging release.

Client custom-domain delegation/registrar transfer, DNS preservation and HTTPS acceptance remain separate setup work. Workers.dev hosting does not prove `soccerbotsg.com` is connected. Central telemetry configuration and actual receiver/alert acceptance are also separate; see the runbook rather than assuming a log switch establishes complete monitoring.

### 5 November 2026 — PR27 production sandbox reactivation

Cloudflare runtime readback confirms production source `c2b7c1cae4d18f1d45bc1837fb3c3f068e3aeb22`. Under owner authorization, restored customer/client sandbox access, trusted provider reads, HitPay checkout/recovery/webhook and reviewed merchant pairing, manual external accounting, ongoing readback and public display warming. Identity email delivery and public-token refresh-ahead remain disabled. Existing eight secrets, D1/coordinator bindings and once-per-minute cron were preserved. This supersedes earlier closed-default activation evidence; it does not establish actual payment/calendar acceptance. Provider timeout remains owner-verified separately. No live booking/payment action was performed.

### 5 November 2026 — observed timeout delay

Owner HAR and invoice evidence align creation around14:52 with due time15:02; cancellation was observed around15:11 (Asia/Singapore). The exact provider cancellation event time is not established. [Accept Payments documentation](https://help.simplybook.me/wiki/Accept_payments_custom_feature) describes automatic cancellation, but publishes no exact scheduler cadence in the reviewed material. [Support thread570](https://tech-support.simplybook.me/t/570-when-booking-with-api-payment-timeout-does-not-work/576) contains a historical customer report of30-minute cancellation for a20-minute timeout; it supports possible delay, not a guaranteed extra10 minutes. Our API creation already supplies `handle_invoice: true`, as advised in [thread601](https://tech-support.simplybook.me/t/601-confirm-booking-after-taking-payment-externally-via-api/607). Treat the configured deadline and observed provider release as separate evidence. No provider setting or cancellation was changed during this investigation.

## Secret locations and configuration changes

- Existing Worker `IDENTITY_PEPPER` also derives scoped reservation customer/IP hashes; new reservation admission fails closed if it is missing or invalid. No new secret installation or provider-setting change is included.

Only names and storage locations are recorded here. Never include values, API response headers, EPP codes, passwords, bank details or customer records in this file.

| Store                         | Names / responsibility                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Staging Worker secrets        | `SIMPLYBOOK_DEV_COMPANY_LOGIN`, `SIMPLYBOOK_DEV_ADMIN_LOGIN`, `SIMPLYBOOK_DEV_API_KEY`, `SIMPLYBOOK_DEV_ADMIN_API_USER_KEY`, `SIMPLYBOOK_DEV_SIGNING_SECRET`                                     |
| Client Worker secrets         | Corresponding `SIMPLYBOOK_PROD_*` names; no developer fallback                                                                                                                                   |
| Matching Worker secret store  | `HITPAY_SANDBOX_API_KEY`, `HITPAY_WEBHOOK_SALT`, `IDENTITY_PEPPER`; bot secret `TURNSTILE_SECRET` on staging or `TURNSTILE_SECRET_KEY` on production; `RESEND_API_KEY` where email is configured |
| Client GitHub Actions secrets | `STAGING_CLOUDFLARE_API_TOKEN`, `PRODUCTION_CLOUDFLARE_API_TOKEN`, separately scoped to the intended accounts                                                                                    |
| Cloud Containers              | Environment-managed developer credentials for authorized work; presence here does not install them in GitHub or a Worker                                                                         |

Presence is not proof of correctness, entitlement or successful provider authentication. Do not copy proxy placeholder values into provider settings. The owner previously chose a five-year API-user-key expiry; the exact issuance/expiry date was not captured here. Record it privately with renewal reminders and rotate before expiry rather than calculating a date from this document's review date.

For each change: identify the environment and setting, explain why it changes, reconcile source guards and provider configuration, validate the relevant owner workflow, then update this reference with dated evidence. Use Progress for outstanding actions, not a second backlog here. Code/provider changes do not authorize bookings, payments, emails or destructive cleanup.

## Booking support and notification drafts

Owner supplied the change/cancellation contact on 2 November: **Glenna, +65 9014 3819**, [WhatsApp](https://wa.me/6590143819). A message is a request; the booking stays unchanged until the studio confirms it. Do not imply automatic cancellation, rescheduling or refund approval. The confirmation WhatsApp Enquiry action uses this contact; customer downloads are retired.

Production PR21 displays the retained API number, which owner test10 showed as an O-prefixed order while SimplyBook later returned SI-2026000006/7 for the same invoice IDs. The owner reports the client email already had the correct number almost immediately. The local follow-up captures the unpaid number before accounting and enriches the paid document separately; see Progress for deployment state and API contracts for bounds. Prefixes are not configurable proof and must never be rewritten. Old records without a captured baseline omit the unverified number.

### Complete HTML drafts and editor setup

**On hold by owner request (2 November).** Retain these drafts for later; current work proceeds to application staging and owner flow/device tests. No notification feature is to be enabled or email sent under this checkpoint.

Drafts: [customer](notification-templates/customer.html), [admin](notification-templates/admin.html), [trainer](notification-templates/trainer.html). [PNG logo](../public/assets/notification-logo.png) preserves the approved logo pixels in an email-compatible format. The HTML uses a temporary staging logo URL for review; upload the PNG through SimplyBook's media editor and replace that URL with its stable HTTPS media URL before enabling notifications. Do not use a private repository URL, filesystem path or embedded data URL as the email image source.

On 2 November the client connector reported **Custom email** and **Flexible Notifications** disabled. Its tools expose feature inspection but no notification-template read/write operation. Templates have therefore been prepared in source, not saved in SimplyBook; no feature or notification was enabled and no email was sent. The owner can open the [Custom email editor](https://soccerbotadmin.secure.simplybook.asia/v2/ext/custom-email), check plan/feature costs, and inspect supported HTML editing without activating delivery.

Every `[[FIELD]]` in these files is an intentionally unbound draft placeholder, **not claimed SimplyBook syntax**. Use the editor's variable picker to replace each field. Never send with unresolved fields. Needed fields: customer name; session date/start/end/service/player count/trainer; invoice document number; total paid; customer booking link; admin-only customer phone/email. If the editor cannot supply a field, omit it or revise the design—do not label an internal ID as an invoice number or create an unauthenticated application link. Staff links open SimplyBook and require individual login.

For multi-session bookings, repeat the session block only using a supported provider list mechanism; otherwise use one notification per session and do not present the full invoice total as that session's charge. Customer/admin messages may include all applicable sessions; each trainer receives only their own assignments. Do not copy all trainers or customers into a shared recipient list.

These are **confirmed, paid booking drafts**, not generic booking-created messages. Verify the exact SimplyBook trigger, payment/accounting state and duplicate-notification behavior before enabling. Existing Resend handles identity/account email; a new application-owned booking notification pipeline would be separate reviewed implementation. Do not add it merely to compensate for an unverified SimplyBook trigger. Use a neutral request/awaiting-payment template instead if only an initial booking event is available. Delivery failures must not delay the verified website confirmation or change payment/booking state.

Suggested subjects: customer “Booking confirmed — [[SESSION_DATE]]”; admin “Confirmed booking — [[SESSION_DATE]] — [[CUSTOMER_NAME]]”; trainer “Your session — [[SESSION_DATE]] at [[SESSION_START]]”. Use SoccerBotStudio Singapore as the sender name and a monitored contact reply-to where the provider supports it. Verify sender authentication. Keep marketing, raw technical state and internal IDs out of these transactional messages. Provide a matching plain-text version in the provider editor where supported. Preview actual substitutions, long/multiple sessions, logo-blocked rendering, mobile layout and recipient isolation before owner acceptance. No exact rendering or delivered-email acceptance is claimed from source validation.

### 3 November 2026 — production calendar warming re-enabled

Owner authorized restoration before the next trial. Cloudflare settings PATCH and independent GET verified `PUBLIC_DISPLAY_WARMING=enabled` on `soccerbot-production`, source `662bea3764bb7546a216f1f4f3790fbcb1e28a67`; all other 45 bindings were inherited, including eight secrets. Existing cron remains `* * * * *`; application admission limits calendar warming to approximately 15 minutes. `PUBLIC_TOKEN_REFRESH_AHEAD` remains disabled. This confirms configuration, not successful scheduled execution or deployment of the local cache repair. Source deployment may restore closed defaults: recheck warming after deploying the consolidated candidate and before owner trials.

Special-contact enquiry check (3 November2026): deployed86e3cd5 uses the local preview adapter for `services.enquiry.submit`; no email is sent and no recipient binding is configured. contact@soccerbotsg.com is the published contact address, not a verified delivery destination for this form. Identity-email configuration does not activate enquiry delivery. No live email was sent during this check.

### 5 November 2026 — resume owner A–D production sandbox trials

Restored previously authorized sandbox configuration on production source `5f179a0b379577ab2239528b6ad44a35402cc8ee`. Independent Cloudflare GET confirms customer/client sandbox access, trusted provider reads, HitPay checkout/recovery/webhook, live readback and public display warming enabled; route hitpay, external payment sandbox-reviewed, processor manual. Identity delivery and public-token refresh-ahead remain disabled. Existing eight secret bindings and resource identities were inherited; minute cron remains unchanged. This is configuration evidence, not provider booking/payment or scheduled-warming acceptance. No assistant booking, payment or notification occurred. Staging booking capacity remains exhausted; this round uses the production sandbox.

Activation correction: owner reported access still disabled after the first switch readback. Source `clientSandboxAccess` also requires actual `HITPAY_MERCHANT` and `HITPAY_BUSINESS_ID` to match their reviewed expected values, plus `HITPAY_CONTRACT_ACCEPTED=sandbox-reviewed`. These three runtime bindings had been omitted from restoration; added them using the existing reviewed app404 pairing, inheriting all other bindings. Switch readback alone did not establish effective access. Workspace direct production health was blocked with HTTP403, so owner refresh remains the public-route confirmation. Future activation checks must include the complete sandbox pairing guard as well as toggles; do not report ready from switches alone.

## Checkout timing follow-up — 5 November 2026

The owner selected10 minutes in the supplied SimplyBook payment-timeout screenshot and requested8/9/10-minute application timing. Local migration0037 and new-attempt policy implement that split; old attempts remain unchanged. Read-only `paid_events` connector inspection confirms Accept payments is enabled/configured, but exposes no saved timeout value. That earlier ten-minute setting was not verified; the current owner decision and activation scope are recorded below. No provider settings were changed by this source task. Test paid return, a fully unpaid expiry, a late payment, and reselecting the released slot; do not infer provider settlement acceptance from synthetic tests.

Round-four evidence, reconciled 6 November: the retained owner HAR records creation at 22:56:21 SGT on 5 November and an invoice due at 22:58:20. The application rejected that short deadline with `native_checkout_expiry_unverified`, retaining the known uncertain provider session. A configured hold, invoice due time and observed cancellation/release time are distinct; cancellation emails do not extend payment authority. The earlier screenshot and 15-minute confirmation do not establish the currently saved provider setting. Latest owner decision on 6 November: return the provider payment timeout to ten minutes. The supplied admin screenshot shows10 minutes selected; it does not by itself prove saving or a new invoice's effective deadline. The connector cannot read/write this saved setting. Verify a newly created invoice's deadline in the next owner-operated A–D test. The application eight-minute payment window is unchanged. The owner subsequently revoked merge authorization after staging; client-sandbox restoration is on hold and runtime settings remain unchanged. Live merchant activation remains outside scope. New-attempt recovery uses the separate twelve-minute boundary under BR-011; it cannot extend the provider invoice deadline. No provider mutation or booking/payment acceptance occurred during this reconciliation.

### 6 November 2026 — final delivery and sandbox restoration scope

Owner instruction: finish final CI, verify exact staging revision/health, merge PR32, verify merged-main deployment, then enable the existing production-named client sandbox for A–D. Read-only Cloudflare inspection before delivery found customer/client sandbox, provider, HitPay and warming switches disabled, existing company soccerbotadmin/service3–4 and reviewed app404 merchant/business mapping retained, and eight secret bindings present. This is the closed baseline, not activation evidence. After deployment, inherit all unrelated bindings/resources/secrets and restore the previously reviewed client-sandbox switches and complete merchant/contract pairing. Keep identity email delivery and public-token refresh-ahead disabled. Do not enable a live merchant or make assistant booking/payment/cancellation operations. Record runtime readback and public-health evidence/limitations in the PR delivery receipt; a screenshot of10 minutes selected is still not a new invoice due-time observation.

Latest delivery correction (6 November): after44540b6 passed CI/staging, the owner said “dont merge”. Automatic approval review rejected the in-flight merge. PR32 remains open/unmerged and the sandbox switches remain at the observed disabled baseline; prior restoration instructions above are superseded. No provider setting or runtime mutation occurred.

### 10 November 2026 — persistent approved sandbox configuration (prepared)

PR53 deployed production `db999ed`; approved runtime settings were restored and independently read back, including the actual/expected app404 merchant and business pairing, customer access, trusted provider reads, HitPay checkout/recovery/webhook, live readback, public display warming and token refresh-ahead. Identity delivery stayed disabled; existing secrets and D1/coordinator identity were preserved. Runtime activation did not persist through ordinary deployment because the manifest still selected closed access.

The consolidated follow-up explicitly selects `client-sandbox` in `deployment/production.json`. Its release overlay declares the approved values and post-deployment readback checks them against the sealed artifact. Closed installation and staging remain separate profiles. This change is prepared for CI/staging, not yet merged/deployed; current production settings remain enabled. Domain/email and live-merchant activation are outside this change.
