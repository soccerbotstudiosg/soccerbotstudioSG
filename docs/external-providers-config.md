# External providers configuration

- Current configuration reference for the intended settings and verification limits for SimplyBook, Resend, HitPay and Cloudflare.
- It contains no credential values, customer records or raw diagnostic logs.
- It is not an instruction to activate services or copy staging credentials into production.

- [Development](development.md) owns executable configuration names and commands; [Runbook](runbook.md) owns deployment, recovery and rotation procedures; [Progress](../PROGRESS.md) owns the current release and next action; [Journey](journey.md) retains dated evidence.
- Target manifests own reviewed infrastructure identifiers.
- Update this reference when provider settings change, recording whether evidence is API-observed, owner-confirmed or still pending.
- A historical check is not a live monitor.

## Environment boundaries

| Area                                      | Developer staging                                         | Client deployment                                                        |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Purpose                                   | Development and owner acceptance with developer resources | Client infrastructure; closed source defaults; live trading not accepted |
| SimplyBook company                        | `soccerbot`                                               | `soccerbotadmin`                                                         |
| Weekday / weekend and public-holiday rate | S$88 / S$108                                              | S$108 / S$128                                                            |
| HitPay                                    | Approved app404 sandbox                                   | Same approved sandbox temporarily; live merchant setup pending           |
| Cloudflare Worker                         | `soccerbot-dev`                                           | `soccerbot-production`                                                   |
| Source of intended settings               | [Staging target](../deployment/staging.json)              | [Production target](../deployment/production.json)                       |

- The same application implements both profiles.
- Public catalogue metadata selects the displayed price profile; calendar quotes, booking validation and payment matching remain authoritative.
- Display text cannot authorize a charge.
- Staging tests exercise the shared UI and recovery logic, but do not establish client account settings, exact client amounts, live payments, email delivery or production latency.
- The two deployments may temporarily run different revisions; check release receipts before comparing behavior.

## SimplyBook — schedules, bookings and invoices

- SimplyBook owns availability, booking records and invoices.
- HitPay collects payment; the application verifies it and records external payment against the original SimplyBook invoice.
- Provider timeouts and uncertain writes must not cause duplicate bookings or accounting operations.

### Service mapping

| Setting                                    | Staging                 | Client                  | Reason                                                                                            |
| ------------------------------------------ | ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Weekday service                            | ID2, S$88               | ID3, S$108              | Explicit company-local service mapping                                                            |
| Weekend / Singapore public-holiday service | ID3, S$108              | ID4, S$128              | Date-based premium price; IDs are not portable between companies                                  |
| Currency                                   | SGD                     | SGD                     | Payment amount/currency must match the original invoice                                           |
| Session / changeover                       | 40 minutes / 10 minutes | 40 minutes / 10 minutes | Studio occupancy includes changeover                                                              |
| Linked provider IDs                        | 2, 3, 4, 5, 6           | 2, 3, 4, 5, 6           | All five are linked to both services; equal IDs do not establish shared identity across companies |

- Configured client roster (revalidate before acceptance): Faisal (2), Nabil (3), Caelan (4), Rifqi (5), Azam (6).
- Add future trainers through reviewed provider/service mappings and schedule checks; the application reads the complete bounded linked roster rather than assuming three or five trainers forever.

- The approved prices are centralized in `src/domain/session-pricing.ts`.
- Changing a tariff requires reconciling SimplyBook services, that profile, display/quote tests and owner acceptance together.
- A provider price that disagrees with the configured profile is rejected, not silently accepted.

### Capacity and scheduling

| Setting                            | Latest evidence                                                                    | Meaning / remaining check                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account-wide simultaneous bookings | One in both environments; owner-confirmed; admin override prohibited               | Applies across trainers. Preserve the shared studio and changeover constraint; controlled customer/admin cross-trainer acceptance remains required |
| Client advance notice              | Owner confirmed four hours                                                         | Provider setting; do not infer enforcement from a displayed slot alone                                                                             |
| Client unpaid invoice timeout      | Ten minutes selected by owner; saved setting and fresh invoice deadline unverified | An unpaid invoice may expire/cancel at the provider; successful payment must be reconciled against the original booking/invoice                    |
| Company/service hours              | Noon–8pm daily; revalidate provider configuration                                  | Trainer availability further constrains bookable times                                                                                             |
| Trainer scheduling                 | Date-specific availability; weekly days off                                        | Enter schedules on the common 50-minute grid; recheck date overrides as well as weekly hours                                                       |

- API, Accept Payments, Multiple Bookings, Limit Bookings and custom booking interval features were previously observed enabled.
- Enablement is not proof of current plan entitlements or each feature's settings.
- Verify the four-hour cutoff, the saved timeout against the current checkout timing policy, and capacity controls in the intended company before accepting real bookings.

- Payment timing: provider timeout target10 minutes; app payment8 minutes, checking1 minute and recovery3 minutes.
  - Verify saving and a fresh invoice's issued/due timestamps; old invoices keep their original deadlines.
  - Deadline expiry does not prove provider cancellation or capacity release.

- Provider authentication: encrypted access/refresh-token rotation;50-minute access retention against the normal one-hour contract; consume refresh authority before dispatch.
  - Verify actual account timeout/refresh response; shorter expiry must not replay protected writes.
  - Provider host remains `user-api-v2.simplybook.me`.

- Test availability: client provider IDs2–6 have approved date-specific fixtures for1 December2026–31 January2027,12:00–20:00 Singapore, no breaks.
  - Re-read before any separately authorised cleanup; protect later edits and booking history.
  - Clearing a special day falls back to the weekly schedule.
  - Full-range readback and cache/latency acceptance remain pending.

- Invoice metadata: capture the unpaid document before accounting; enrich the paid document independently.
  - Never rewrite prefixes or substitute internal IDs; old records without verified baseline omit the number.

- Provider-hosted landing-page marketing requires owner reconciliation with approved tariffs before promotion.

### Notifications, access and maintenance

- The owner reported trainer notifications switched off during the recent setup conversation.
- This is owner-confirmed, not a fresh API inspection or proof that every customer/admin reminder channel is off.
- Review each relevant recipient/channel in SimplyBook notification settings before relying on suppression.
- Resend identity emails and SimplyBook booking/trainer notifications are separate systems.

- Use individual staff accounts and existing provider records.
- Role capabilities, seats and costs need owner verification; do not assume a named junior role exists or that trainers can edit only their own schedules.
- Follow [Admin UAT](tests/uat/admin.md) and [Trainer UAT](tests/uat/trainers.md).

## Resend — application email delivery

- Resend supports the application's email identity/account flows.
- It does not replace SimplyBook's booking/trainer notification configuration, and a verified sender does not itself enable application email delivery.

| Setting                  | Recorded state                                                                     | Required before client email acceptance                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Account ownership        | Owner confirmed client-controlled account                                          | Retain client login, billing, MFA and recovery ownership                                                             |
| Client domain            | `soccerbotsg.com`, registered in Tokyo region, sending only; tracking off at setup | DNS verification remains pending in the last recorded checkpoint; not freshly queried for this document              |
| Intended sender          | `contact@soccerbotsg.com`                                                          | Authenticate the domain and verify the application's permitted sender scope; mailbox existence alone is insufficient |
| DNS changes              | Paused pending authoritative DNS access                                            | Preserve existing MX/SPF/DKIM/DMARC and mail hosting; review required records rather than replacing the whole zone   |
| Client identity delivery | Disabled at the last owner sandbox activation                                      | Explicit configuration and owner-operated account/email acceptance required                                          |
| Staging sender           | Existing developer setup                                                           | Keep its credentials/sender separate; no claim of new sender verification here                                       |

- Record actual domain verification and sender configuration when available.
- Use [email/account UAT](tests/uat/customer.md) for the applicable identity actions.
- Do not send test email merely to complete this inventory.

- Enquiry form uses the preview adapter; published `contact@soccerbotsg.com` is not a verified form-delivery destination.
  - Identity-email setup does not activate enquiry delivery.

## HitPay — hosted payment and webhook recovery

- Both environment mappings use the owner-approved app404 **sandbox**; the client release is currently closed.
- This is a temporary testing arrangement, not client live merchant ownership or proof of production readiness.
- The client Worker can create real SimplyBook booking/invoice records even when payment is sandboxed; owner tests need deliberate dates and capacity.

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

- Shared sandbox ownership does not make payment records interchangeable.
- Preserve retained account/company/merchant/business/credential scope and original financial references.
- When the client domain changes, review webhook/return origins and runtime guards together; do not simply edit a dashboard URL and assume compatibility.

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

- Resource IDs and public widget keys belong to the [target manifests](../deployment); do not copy or recreate them from this prose.
- D1 and Durable Object placement are distinct.
- A location hint or historical KIX observation does not guarantee a permanent Worker or object execution location.
- Preserve foundation registration and durable storage across deployments.

- The owner authorized persistent once-per-minute recovery scheduling; prior runtime readback recorded it on both Workers.
- It supports recovery after browser closure and scheduled display refresh.
- Do not infer current trigger presence from source alone; inspect runtime settings when diagnosing missed recovery.

- The canonical deployment owner is the client GitHub repository.
- Trusted, verified ready PRs deploy staging; independently verified merged main deploys the reviewed production artifact.
- Follow the [release procedure](runbook.md#6-deployments-and-rollback), including actual staging deployment and owner acceptance before merge.
- Staging remains a separate deployment when production is updated.

- Source defaults and temporary runtime activation are different evidence.
- A normal client deployment can restore closed settings; an owner test override is not a permanent launch configuration.
- Never enable live payments/email or provision replacement D1/DO resources as a side effect of a routine staging release.

- Client custom-domain delegation/registrar transfer, DNS preservation and HTTPS acceptance remain separate setup work.
- Workers.dev hosting does not prove `soccerbotsg.com` is connected.
- Central telemetry configuration and actual receiver/alert acceptance are also separate; see the runbook rather than assuming a log switch establishes complete monitoring.

- Client sandbox activation and PR32 merge remain on hold.
  - Runtime state must be read back for the exact deployment; source defaults do not prove activation.
  - Validate complete merchant/business/contract pairing as well as feature switches before any separately authorised activation.

## Secret locations and configuration changes

- Only names and storage locations are recorded here.
- Never include values, API response headers, EPP codes, passwords, bank details or customer records in this file.

| Store                         | Names / responsibility                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Staging Worker secrets        | `SIMPLYBOOK_DEV_COMPANY_LOGIN`, `SIMPLYBOOK_DEV_ADMIN_LOGIN`, `SIMPLYBOOK_DEV_API_KEY`, `SIMPLYBOOK_DEV_ADMIN_API_USER_KEY`, `SIMPLYBOOK_DEV_SIGNING_SECRET` |
| Client Worker secrets         | Corresponding `SIMPLYBOOK_PROD_*` names; no developer fallback                                                                                               |
| Matching Worker secret store  | `HITPAY_SANDBOX_API_KEY`, `HITPAY_WEBHOOK_SALT`, `TURNSTILE_SECRET`, `IDENTITY_PEPPER`; `RESEND_API_KEY` where email is configured                           |
| Client GitHub Actions secrets | `STAGING_CLOUDFLARE_API_TOKEN`, `PRODUCTION_CLOUDFLARE_API_TOKEN`, separately scoped to the intended accounts                                                |
| Cloud Containers              | Environment-managed developer credentials for authorized work; presence here does not install them in GitHub or a Worker                                     |

- Presence is not proof of correctness, entitlement or successful provider authentication.
- Do not copy proxy placeholder values into provider settings.
- The owner previously chose a five-year API-user-key expiry; the exact issuance/expiry date was not captured here.
- Record it privately with renewal reminders and rotate before expiry rather than calculating a date from this document's review date.

- For each change: identify the environment and setting, explain why it changes, reconcile source guards and provider configuration, validate the relevant owner workflow, then update current settings here and record dated evidence only in Journey.
- Use Progress for outstanding actions, not a second backlog here.
- Code/provider changes do not authorize bookings, payments, emails or destructive cleanup.

## Booking support and notification drafts

- Change/cancellation contact: **Glenna, +65 9014 3819**, [WhatsApp](https://wa.me/6590143819).
- A message is a request; the booking stays unchanged until the studio confirms it.
- Do not imply automatic cancellation, rescheduling or refund approval.
- The confirmation WhatsApp Enquiry action uses this contact; customer downloads are retired.

- Notifications: drafts remain uninstalled and on hold.
  - Check actual feature/plan entitlements in the provider editor; preview substitutions, recipients and triggers before separately authorised delivery.

### Complete HTML drafts and editor setup

- **On hold:** retain drafts for later owner setup and acceptance.
- No notification feature is to be enabled or email sent without separate owner authorisation.

- Drafts: [customer](notification-templates/customer.html), [admin](notification-templates/admin.html), [trainer](notification-templates/trainer.html).
- [PNG logo](../public/assets/notification-logo.png) preserves the approved logo pixels in an email-compatible format.
- The HTML uses a temporary staging logo URL for review; upload the PNG through SimplyBook's media editor and replace that URL with its stable HTTPS media URL before enabling notifications.
- Do not use a private repository URL, filesystem path or embedded data URL as the email image source.

- Every `[[FIELD]]` in these files is an intentionally unbound draft placeholder, **not claimed SimplyBook syntax**.
- Use the editor's variable picker to replace each field.
- Never send with unresolved fields.
- Needed fields: customer name; session date/start/end/service/player count/trainer; invoice document number; total paid; customer booking link; admin-only customer phone/email.
- If the editor cannot supply a field, omit it or revise the design—do not label an internal ID as an invoice number or create an unauthenticated application link.
- Staff links open SimplyBook and require individual login.

- For multi-session bookings, repeat the session block only using a supported provider list mechanism; otherwise use one notification per session and do not present the full invoice total as that session's charge.
- Customer/admin messages may include all applicable sessions; each trainer receives only their own assignments.
- Do not copy all trainers or customers into a shared recipient list.

- These are **confirmed, paid booking drafts**, not generic booking-created messages.
- Verify the exact SimplyBook trigger, payment/accounting state and duplicate-notification behavior before enabling.
- Existing Resend handles identity/account email; a new application-owned booking notification pipeline would be separate reviewed implementation.
- Do not add it merely to compensate for an unverified SimplyBook trigger.
- Use a neutral request/awaiting-payment template instead if only an initial booking event is available.
- Delivery failures must not delay the verified website confirmation or change payment/booking state.

- Suggested subjects: customer “Booking confirmed — [[SESSION_DATE]]”; admin “Confirmed booking — [[SESSION_DATE]] — [[CUSTOMER_NAME]]”; trainer “Your session — [[SESSION_DATE]] at [[SESSION_START]]”.
- Use SoccerBotStudio Singapore as the sender name and a monitored contact reply-to where the provider supports it.
- Verify sender authentication.
- Keep marketing, raw technical state and internal IDs out of these transactional messages.
- Provide a matching plain-text version in the provider editor where supported.
- Preview actual substitutions, long/multiple sessions, logo-blocked rendering, mobile layout and recipient isolation before owner acceptance.
- No exact rendering or delivered-email acceptance is claimed from source validation.
