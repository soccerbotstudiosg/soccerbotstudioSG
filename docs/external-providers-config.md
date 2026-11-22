# External providers configuration

Configuration reference for SimplyBook, Resend, HitPay and Cloudflare. Target manifests specify the intended deployment. Use provider readback for actual account settings.

[Development](development.md) owns executable configuration names and commands; [Runbook](runbook.md) owns deployment, recovery and rotation procedures; [Progress](../PROGRESS.md) owns the current release and next action; [Journey](journey.md) retains dated evidence. Target manifests own reviewed infrastructure identifiers. Update this reference when provider settings change, recording whether evidence is API-observed, owner-confirmed or still pending. A historical check is not a live monitor.

## Environment boundaries

| Area                                      | Developer staging                                         | Client deployment                                                               |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Purpose                                   | Development and owner acceptance with developer resources | Client infrastructure; client sandbox profile; live merchant acceptance pending |
| SimplyBook company                        | `soccerbot`                                               | `soccerbotadmin`                                                                |
| Weekday / weekend and public-holiday rate | S$88 / S$108                                              | S$108 / S$128                                                                   |
| HitPay                                    | Approved app404 sandbox                                   | Same approved sandbox temporarily; live merchant setup pending                  |
| Cloudflare Worker                         | `soccerbot-dev`                                           | `soccerbot-production`                                                          |
| Source of intended settings               | [Staging target](../deployment/staging.json)              | [Production target](../deployment/production.json)                              |

- The same application implements both profiles.
- Public catalogue metadata selects the displayed price profile; calendar quotes, booking validation and payment matching remain authoritative.
- Display text cannot authorize a charge.
- Staging tests exercise the shared UI and recovery logic, but do not establish client account settings, exact client amounts, live payments, email delivery or production latency.
- The two deployments may temporarily run different revisions; check release receipts before comparing behavior.

## SimplyBook — schedules, bookings and invoices

SimplyBook owns availability, booking records and invoices. HitPay collects payment; the application verifies it and records external payment against the original SimplyBook invoice. Provider timeouts and uncertain writes must not cause duplicate bookings or accounting operations.

### Service mapping

Both service lists were read through their respective connectors on 2 November 2026. Client company information independently reported login `soccerbotadmin` and timezone `Asia/Singapore`.

| Setting                                    | Staging                 | Client                  | Reason                                                                                            |
| ------------------------------------------ | ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Weekday service                            | ID2, S$88               | ID3, S$108              | Explicit company-local service mapping                                                            |
| Weekend / Singapore public-holiday service | ID3, S$108              | ID4, S$128              | Date-based premium price; IDs are not portable between companies                                  |
| Currency                                   | SGD                     | SGD                     | Payment amount/currency must match the original invoice                                           |
| Session / changeover                       | 50 minutes / 10 minutes | 50 minutes / 10 minutes | Studio occupancy includes changeover                                                              |
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
| Trainer scheduling                 | Owner intentionally uses date-specific availability; weekly days were off at prior inspection                                                                           | Enter schedules on the hourly grid; recheck date overrides as well as weekly hours                                                                            |
| Initial mock schedule              | Prior authorized setup covered 3–21 November 2026 for five trainers                                                                                                     | Temporary test availability, not a production scheduling recommendation. Official opening is 22 November; existing entries from that date were left untouched |
| Grid evidence                      | Production on 21 November: service 4, trainer 2 returned eight hourly starts for 22 November, noon through 19:00                                                        | Two sampled dates do not verify every date or future trainer                                                                                                  |

API, Accept Payments, Multiple Bookings, Limit Bookings and custom booking interval features were previously observed enabled. Enablement is not proof of current plan entitlements or each feature's settings. Verify the four-hour cutoff, the saved timeout against the current checkout timing policy, and capacity controls in the intended company before accepting real bookings. The earlier 15-minute confirmation is historical, not the current accepted setting.

### Date-specific test schedules

- December 2026 and January 2027 test entries cover trainer IDs 2–6. Before cleanup, read each current entry and protect later schedule edits.
- Clearing a special day returns it to the weekly schedule. Do not alter weekly hours or bookings during cleanup.

### Admin authentication

The Worker rotates encrypted admin refresh credentials. Verify account-specific token lifetime and the refresh response for the intended company. [Token operations](runbook.md#token-event-dictionary)

### Notifications, access and maintenance

On 22 November the owner worked through customer booking/reminder/change/cancellation, trainer notifications and payment/invoice templates, and reported that the admin receives notifications for all providers. This supersedes the earlier report that trainer notifications were switched off. It is conversation evidence, not a fresh settings export or proof that every trigger/channel delivers. Verify each recipient, trigger and mobile rendering separately. Resend application emails and SimplyBook booking/trainer notifications remain separate systems.

Use individual staff accounts and existing provider records. Role capabilities, seats and costs need owner verification; do not assume a named junior role exists or that trainers can edit only their own schedules. Follow [Admin UAT](uat/admin.md) and [Trainer UAT](uat/trainers.md).

A separate SimplyBook-hosted landing-page description still contained older package marketing during the 2 November read. It is provider-managed content, not the website's tariff authority or an approved application package feature. Owner should reconcile that content before promoting the provider-hosted page. This reference deliberately does not reproduce it.

## Resend — application email delivery

Resend supports the application's email identity/account flows. It does not replace SimplyBook's booking/trainer notification configuration, and a verified sender does not itself enable application email delivery.

| Setting                  | Recorded state                                                                            | Required before client email acceptance                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Account ownership        | Owner confirmed client-controlled account                                                 | Retain client login, billing, MFA and recovery ownership                                                             |
| Client domain            | `soccerbotsg.com`, registered in Tokyo region, sending only; tracking off at setup        | Domain and all four issued DNS records verified by Resend on 11 November 2026                                        |
| Intended sender          | `contact@soccerbotsg.com`                                                                 | Authenticate the domain and verify the application's permitted sender scope; mailbox existence alone is insufficient |
| DNS changes              | Four Resend sending records added on 11 November 2026; existing mailbox records preserved | Preserve existing MX/SPF/DKIM/DMARC and mail hosting; review required records rather than replacing the whole zone   |
| Client identity delivery | Production target declares the studio sender; verify actual delivery in the target inbox  | Explicit configuration and owner-operated account/email acceptance required                                          |
| Staging sender           | Existing developer setup                                                                  | Keep its credentials/sender separate; no claim of new sender verification here                                       |

- The production Turnstile sitekey matches the client widget and permits the Workers.dev production hostname and soccerbotsg.com.
- Production RESEND_API_KEY secret presence was verified without reading its value.
- SimplyBook SMTP reports enabled/configured after owner setup: smtp.resend.com, SSL port465, username resend, sender contact@soccerbotsg.com.
- Saved SMTP settings do not establish delivery.
- Test website Turnstile/code verification first; then finalize SimplyBook notifications.
- Customers have no self-service reservation management: omit edit/cancel/reschedule links and direct enquiries to staff.
- Domain cutover was owner-authorized on13 November2026 for a sandbox client presentation: runtime origin is now `https://soccerbotsg.com`.
- The existing Turnstile allowlist already covers it.
- The owner subsequently confirmed access and a complete payment through confirmation on the new domain.
- Use [email/account UAT](uat/simulated-user.md) for the applicable identity actions.
- Do not send test email merely to complete this inventory.

## HitPay — hosted payment and webhook recovery

Both target manifests select the approved app404 sandbox. This is a temporary testing arrangement, not client live merchant ownership or proof of production readiness. The client Worker can create real SimplyBook booking/invoice records even when payment is sandboxed; owner tests need deliberate dates and capacity.

| Setting                | Configuration / explanation                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox identity       | Reviewed merchant/business identity is sealed in each target manifest; API key and webhook salt stay in the matching Worker secret store                                           |
| Staging webhook        | `https://soccerbot-dev.limyousheng-94.workers.dev/api/webhooks/hitpay`                                                                                                             |
| Client sandbox webhook | `https://soccerbotsg.com/api/webhooks/hitpay`                                                                                                                                      |
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
| Worker and origin | `soccerbot-dev.limyousheng-94.workers.dev` | `soccerbotsg.com`                                                                  |
| D1                | `soccerbot-dev-state`                      | `soccerbot-production-state`                                                       |
| Named coordinator | `simplybook-developer-account`             | `simplybook-production-account`                                                    |
| Placement         | Existing coordinator identity retained     | First acquisition uses reviewed `apac-ne` hint; prior telemetry observed KIX/Osaka |
| Turnstile         | Separate staging widget/key                | Separate client widget/key; keep allowed hostnames and secret paired               |
| Source default    | Developer sandbox                          | Reviewed client sandbox access profile                                             |

Resource IDs and public widget keys belong to the [target manifests](../deployment); do not copy or recreate them from this prose. D1 and Durable Object placement are distinct. A location hint or historical KIX observation does not guarantee a permanent Worker or object execution location. Preserve foundation registration and durable storage across deployments.

The owner authorized persistent once-per-minute recovery scheduling; prior runtime readback recorded it on both Workers. It supports recovery after browser closure and scheduled display refresh. Do not infer current trigger presence from source alone; inspect runtime settings when diagnosing missed recovery.

The canonical deployment owner is the client GitHub repository. Trusted, verified ready PRs deploy staging; independently verified merged main deploys the reviewed production artifact. Follow the [release procedure](runbook.md#6-deployments-and-rollback), including actual staging deployment and owner acceptance before merge. Staging remains a separate deployment when production is updated.

Client custom-domain delegation/registrar transfer, DNS preservation and HTTPS acceptance remain separate setup work. Workers.dev hosting does not prove `soccerbotsg.com` is connected. Central telemetry configuration and actual receiver/alert acceptance are also separate; see the runbook rather than assuming a log switch establishes complete monitoring.

SimplyBook cancellation may occur after the configured invoice deadline. Use current provider availability to establish when a slot can be offered again.

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

## Payment metadata and refund evidence

The current application verifies HitPay payment state and records external payment through SimplyBook `PUT /admin/invoices/{id}/accept-payment` using the configured `SIMPLYBOOK_EXTERNAL_PROCESSOR`. It does not retain/pass the actual card brand or payment method. HitPay's [charge-details API](https://docs.hitpayapp.com/apis/charges/get-charge-detail) documents method/card-brand metadata, but supported SimplyBook classification values and their display have not been verified. Do not substitute arbitrary Visa/PayNow labels into the payment-confirmation contract.

The owner supplied a HitPay sandbox refund email on 22 November showing refunded status, amount, masked card details, date and reference. This verifies that test's notification; it does not establish all dashboard defaults, live delivery, a downloadable PDF or automatic SimplyBook synchronization. The [refund API](https://docs.hitpayapp.com/apis/refund/refund) exposes email controls. [SimplyBook documentation](https://help.simplybook.me/wiki/Accept_payments_custom_feature) places native refund confirmation under SBPay.me Pro; this does not establish refund support for externally recorded manual payments. Follow the [refund workflow](runbook.md#refunds-and-customer-notifications).

The supplied invoice still showed the company login as the issuer name and a personal phone in the company block. Check SBPay company-profile fields and SimplyBook company information independently; customer billing contacts are separate. Invoice notes do not correct header metadata. Business name, studio phone/address, website, next invoice rendering and live HitPay merchant branding remain owner verification items. Do not commit customer identities or invoice records as fixtures.

## Booking support and notification drafts

- Changes and cancellations go to [studio WhatsApp](https://wa.me/6590143819). Staff confirm the change in SimplyBook.
- The app sends its verification, enquiry and booking-help emails through Resend. Check sender, Reply-To, accepted delivery and actual inbox rendering independently.
- SimplyBook manages the configured invoice, booking confirmation, reminder and staff notifications. Check the trigger, recipient and paid state before enabling a custom template.
- The SimplyBook design editor accepts `{{name}}`, `{{email}}` and `{{content}}`. Place `{{content}}` in a text block. Set booking-specific fields through the Email and SMS or feature-specific settings using the available variable picker.
- The [customer](notification-templates/customer.html), [admin](notification-templates/admin.html) and [trainer](notification-templates/trainer.html) HTML drafts contain unbound sample fields. Verify the supported fields, list handling, links and real rendering before sending. Avoid presenting a multi-session invoice total as one session’s price.

### Optional correlation for an interrupted booking

- The Worker can attach an opaque per-session marker through SimplyBook's Intake Forms feature.
- It derives the marker from the account, environment, attempt, immutable booking intent and session index.
- The optional `SIMPLYBOOK_RECOVERY_INTAKE_FIELD` setting uses the provider-assigned field name of a dedicated textarea on each applicable service.
- Confirm the field definition returned by the service and booking-report read permissions before enabling this setting.
- Verify the field's visibility on customer-facing SimplyBook pages and notifications in the account.
- Historical bookings carry no marker.
- A matching marker can locate a booking, while financial recovery still requires the provider evidence accepted by the checkout and payment contracts.
- This local change does not configure a provider account.

[SimplyBook Intake Forms API guidance](https://tech-support.simplybook.me/t/817-store-additional-data-while-making-booking/817) · [Booking report filters](https://tech-support.simplybook.me/t/1271-adding-filter-options-on-get-bookings-list-rest-api-call/1271) · [Booking hash availability](https://tech-support.simplybook.me/t/216-booking-confirm-booking-hash/220)
