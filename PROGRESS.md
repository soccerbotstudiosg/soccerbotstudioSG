# Current checkpoint

Observed 3 November 2026, Singapore. Historical evidence belongs in [Journey](docs/journey.md#part-2--dated-changes-and-evidence).

## Current state

- PR21 merged as `86e3cd58316bb60b1c43989e9180451661e9d44b` at the owner's request. Main CI41571261491 and production deployment41572619343 passed. Production runs that revision; checkout/recovery/webhook and public display warming were enabled and independently read back. HitPay remains sandbox; identity email and token refresh-ahead remain disabled.
- Owner test10 completed numbered trials1,2,4 and reported oversized calendar controls, countdown alignment and incorrect invoice numbers. These trials are not blanket acceptance. Email reportedly carried the correct invoice almost immediately.
- Local follow-up on `fix/test10-confirmation-details`: compact calendar controls, redundant helper removed, centred payment countdown, and separate bounded paid-document enrichment. The [database schema map](docs/architecture/database-schema.md) is included in this local batch. The owner has authorized publication and CI for this consolidated branch; deployment remains pending.

## Immediate remaining tasks

1. Review the consolidated test10 candidate and its generated local verification receipts (`test-results/verification-code.json`, `test-results/verification-worker.json`); focused regression and mutation evidence is retained in Journey. Migration0036 must deploy before its Worker.
2. Publish `fix/test10-confirmation-details` as a draft PR and inspect exact-head CI. Keep the PR as the delivery receipt; staging, owner acceptance, merge and production deployment remain separate steps.
3. Owner retest: compare invoice with the email/SimplyBook Pay, wait for late metadata, reload, and run consecutive single/multi journeys with checkout back/continue. Confirm no order number or animation replay, and inspect compact controls on phone and desktop.
4. Complete remaining stale-tab, capacity-release and scheduled-warming trials. Custom email remains on hold.
5. Special-contact form remains preview-only and sends no email. Its live delivery/recipient wiring is unimplemented; the public contact address is contact@soccerbotsg.com.

## Verification limits

The new invoice design captures the authenticated unpaid number before SimplyBook accounting, then accepts a changed number only under confirmed paid proof. Historical bookings without that captured baseline omit an unverified number; no guessed prefix or historical backfill is applied. Provider issuance timing and visual acceptance still require owner testing. The consolidated application checks passed250 frontend/unit tests and472 Worker tests. The subsequent schema documentation change is checked against final D1/DO inventories and local links; executable tests are not repeated for documentation-only changes. See Journey for prior failures and evidence.
