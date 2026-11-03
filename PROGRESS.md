# Current checkpoint

Observed 3 November 2026, Singapore. Historical evidence belongs in [Journey](docs/journey.md#part-2--dated-changes-and-evidence).

## Current state

- PR22 merged as `c561b8857f778cc0048f89dde2d1f14e2203dab3`. Main CI41590019557 and production deployment41591600463 passed. Production settings readback verified that revision. At the owner's request, customer/sandbox access, trusted provider reads, HitPay checkout/recovery/webhook, ongoing readback and calendar warming were restored. Identity email and token refresh-ahead remain disabled; payments remain sandbox. Deployment defaults still close those runtime overrides on the next release.
- Owner test11 completed the current checklist's tests1–5, with session/trainer wording changes requested and a slow second post-payment confirmation. This is completion with exceptions, not blanket acceptance. HAR shows all three journeys receiving final SI invoice metadata on the later receipt read.
- Local branch `fix/test11-booking-summary` aligns confirmation with review wording, prefixes shared session names with Trainer, preserves collapsed full details, and bolds the payment timer. Direct checkout retains service/trainer labels from the existing scoped catalogue snapshot without new provider calls or D1 roundtrips. A missing display snapshot uses neutral labels; historical saved labels are not backfilled.
- Slow confirmation diagnosed: SimplyBook admin authentication returned403, then recovery encountered local authentication/cooldown coordination. The existing90-second retry delay plus minute scheduler postponed the next run. Successful recovery began before the browser refresh. Provider cause of the403 remains unknown. The authorized local follow-up adds encrypted admin refresh rotation, confirmed-payment comment eligibility and deadline-based recovery alarms; cooldown, retry policy and financial authority are unchanged.

- The consolidated batch fixes invalidation during token publication and late expiry rejection during renewal. The latest deeper audit found no new application defect:12 additional isolated scenarios passed, covering token storage/response failures, notification bursts during recovery and uncertain writes, signed notifications against amount/cancellation guards, and three new consecutive-booking combinations. These are diagnostic probes against local source, not additions to the committed test inventory. Full Worker472/472 and unchanged frontend250 tests/all14 checks remain applicable because application/test-suite source is unchanged. Detailed evidence and the initial fixture-only rejection are in Journey; real provider behavior remains an acceptance check.

## Immediate remaining tasks

1. Owner authorized publication for CI on3 November2026. The consolidated batch is prepared for a draft PR from `fix/test11-booking-summary`; exact-head CI remains pending. Keep the UI wording/trainer/timer fixes together with authentication rotation, comment deferral and recovery alarms. Merge and deployment are not authorized by this publication request.
2. After deployment, verify provider refresh behavior and consecutive-booking confirmation timing on the real account; its configured token timeout remains unverified. Retest new-booking labels, collapsed details and bold countdown.
3. Complete remaining checklist tests6–10: multi→single→single, stale-tab capacity, expiry/release, warming overlap and invoice failure/reduced motion. Recheck saved-confirmation receipt refresh, which returned409 once in test11 while retained confirmation remained available.
4. Enquiry stays preview-only; Resend, identity email and custom notifications remain deferred. The large-function refactor remains advice-only.

## Verification limits

HAR records network outcomes, not actual UI paint. Production authentication failure and successful background recovery are corroborated by sanitized Cloudflare traces; provider rejection reasons beyond HTTP403 are not available. The saved public catalogue supplies display labels only, never payment, price or capacity authority. Owner/browser acceptance of the new local presentation remains pending.
